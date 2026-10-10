package com.transitsync.service;

import com.transitsync.dto.*;
import com.transitsync.entity.*;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ForbiddenException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final SeatLayoutRepository seatLayoutRepository;
    private final SystemSettingRepository settingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AuditLogRepository auditLogRepository;

    public SeatMapDto getSeatMapForTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));

        Bus bus = trip.getBus();
        List<SeatLayout> layouts = seatLayoutRepository.findByBusIdOrderByDeckAscRowNumAscColNumAsc(bus.getId());
        List<String> bookedSeatNumbers = bookingSeatRepository.findActiveBookedSeatNumbersByTripId(tripId);
        Set<String> bookedSet = new HashSet<>(bookedSeatNumbers);

        BigDecimal taxRate = getSettingDecimal("tax_rate_percent", new BigDecimal("5.00"));
        BigDecimal serviceFee = getSettingDecimal("service_fee_fixed", new BigDecimal("25.00"));
        int maxSeats = getSettingInt("max_seats_per_booking", 6);

        List<SeatDetailDto> seats = layouts.stream().map(layout -> {
            boolean isBooked = bookedSet.contains(layout.getSeatNumber());
            String seatStatus = isBooked ? "BOOKED" : (layout.isAccessible() ? "AVAILABLE" : "RESERVED");

            return SeatDetailDto.builder()
                    .seatNumber(layout.getSeatNumber())
                    .deck(layout.getDeck())
                    .rowNum(layout.getRowNum())
                    .colNum(layout.getColNum())
                    .seatType(layout.getSeatType())
                    .isAccessible(layout.isAccessible())
                    .status(seatStatus)
                    .fare(trip.getBaseFare())
                    .build();
        }).collect(Collectors.toList());

        return SeatMapDto.builder()
                .tripId(trip.getId())
                .busId(bus.getId())
                .coachTypeName(bus.getCoachType().getName())
                .decks(bus.getCoachType().getDecks())
                .baseFare(trip.getBaseFare())
                .taxRatePercent(taxRate)
                .serviceFee(serviceFee)
                .maxSeatsPerBooking(maxSeats)
                .seats(seats)
                .build();
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public BookingDto createBooking(Long userId, BookingRequest request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<Booking> existing = bookingRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                return mapBookingToDto(existing.get());
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

        if (!"SCHEDULED".equalsIgnoreCase(trip.getStatus())) {
            throw new BadRequestException("Trip is not available for booking. Status: " + trip.getStatus());
        }

        if (trip.getDepartureTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book seats for a past or departed trip.");
        }

        int maxSeats = getSettingInt("max_seats_per_booking", 6);
        if (request.getPassengers().size() > maxSeats) {
            throw new BadRequestException("Cannot book more than " + maxSeats + " seats in a single reservation.");
        }

        List<String> requestedSeatNumbers = request.getPassengers().stream()
                .map(PassengerDetailDto::getSeatNumber)
                .map(String::trim)
                .collect(Collectors.toList());

        // Check duplicates within the request itself
        Set<String> uniqueRequested = new HashSet<>(requestedSeatNumbers);
        if (uniqueRequested.size() < requestedSeatNumbers.size()) {
            throw new BadRequestException("Duplicate seat numbers provided in the booking request.");
        }

        // Verify seats physically exist on the bus
        List<SeatLayout> busSeats = seatLayoutRepository.findByBusIdOrderByDeckAscRowNumAscColNumAsc(trip.getBus().getId());
        Set<String> validSeatNumbers = busSeats.stream().map(SeatLayout::getSeatNumber).collect(Collectors.toSet());
        for (String seatNum : requestedSeatNumbers) {
            if (!validSeatNumbers.contains(seatNum)) {
                throw new BadRequestException("Seat number '" + seatNum + "' does not exist on this bus layout.");
            }
        }

        // CRITICAL DOUBLE-BOOKING PREVENTION: Check database for active bookings
        List<BookingSeat> existingActiveSeats = bookingSeatRepository.findConflictingSeats(trip.getId(), requestedSeatNumbers);
        if (!existingActiveSeats.isEmpty()) {
            String conflicting = existingActiveSeats.stream().map(BookingSeat::getSeatNumber).collect(Collectors.joining(", "));
            throw new ConflictException("Seat(s) " + conflicting + " are already booked. Please choose available seats.");
        }

        // Server-Side Fare Calculation (Never trust client prices)
        BigDecimal baseFare = trip.getBaseFare();
        BigDecimal totalBaseFare = baseFare.multiply(BigDecimal.valueOf(request.getPassengers().size()));
        BigDecimal taxRate = getSettingDecimal("tax_rate_percent", new BigDecimal("5.00"));
        BigDecimal serviceFee = getSettingDecimal("service_fee_fixed", new BigDecimal("25.00"));

        BigDecimal taxAmount = totalBaseFare.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = totalBaseFare.add(taxAmount).add(serviceFee);

        String pnr = "TS" + System.currentTimeMillis() + (new Random().nextInt(900) + 100);

        Booking booking = Booking.builder()
                .pnr(pnr)
                .user(user)
                .trip(trip)
                .baseFareTotal(totalBaseFare)
                .taxAmount(taxAmount.add(serviceFee))
                .totalAmount(totalAmount)
                .status("CONFIRMED")
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        List<BookingSeat> bookingSeats = new ArrayList<>();
        for (PassengerDetailDto p : request.getPassengers()) {
            BookingSeat bs = BookingSeat.builder()
                    .booking(savedBooking)
                    .trip(trip)
                    .seatNumber(p.getSeatNumber().trim())
                    .passengerName(p.getPassengerName().trim())
                    .passengerAge(p.getPassengerAge())
                    .passengerGender(p.getPassengerGender().trim())
                    .fare(baseFare)
                    .status("ACTIVE")
                    .build();
            bookingSeats.add(bs);
        }
        bookingSeatRepository.saveAll(bookingSeats);
        savedBooking.setBookingSeats(bookingSeats);

        // Record payment
        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(totalAmount)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "UPI")
                .paymentStatus("COMPLETED")
                .transactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase())
                .build();
        paymentRepository.save(payment);
        savedBooking.setPayments(Collections.singletonList(payment));

        return mapBookingToDto(savedBooking);
    }

    @Transactional
    public BookingDto cancelBooking(Long bookingId, Long requestingUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(requestingUserId)) {
            throw new ForbiddenException("Access denied: You can only cancel your own bookings.");
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException("Booking has already been cancelled.");
        }

        // Refund calculation based on hours before departure
        Trip trip = booking.getTrip();
        LocalDateTime now = LocalDateTime.now();
        double hoursBefore = (double) Duration.between(now, trip.getDepartureTime()).toMinutes() / 60.0;

        BigDecimal refundPercentage;
        if (hoursBefore >= 24) {
            refundPercentage = getSettingDecimal("refund_rule_24h_plus", new BigDecimal("90.00"));
        } else if (hoursBefore >= 12) {
            refundPercentage = getSettingDecimal("refund_rule_12h_to_24h", new BigDecimal("50.00"));
        } else {
            refundPercentage = getSettingDecimal("refund_rule_sub_12h", BigDecimal.ZERO);
        }

        BigDecimal refundAmount = booking.getTotalAmount().multiply(refundPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        // Mark seats as CANCELLED to free them up in the unique constraint
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(booking.getId());
        for (BookingSeat s : seats) {
            s.setStatus("CANCELLED");
        }
        bookingSeatRepository.saveAll(seats);

        // Record refund
        Refund refund = Refund.builder()
                .booking(booking)
                .refundAmount(refundAmount)
                .refundPercentage(refundPercentage)
                .hoursBeforeDeparture(BigDecimal.valueOf(Math.max(0, hoursBefore)).setScale(2, RoundingMode.HALF_UP))
                .status("PROCESSED")
                .build();
        refundRepository.save(refund);

        if (isAdmin) {
            auditLogRepository.save(AuditLog.builder()
                    .adminUserId(requestingUserId)
                    .action("CANCEL_BOOKING")
                    .entityType("BOOKING")
                    .entityId(booking.getId().toString())
                    .details("Admin cancelled booking PNR " + booking.getPnr() + " with refund " + refundAmount)
                    .build());
        }

        return mapBookingToDto(booking);
    }

    public BookingDto getBookingById(Long bookingId, Long requestingUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(requestingUserId)) {
            throw new ForbiddenException("Access denied: You do not have permission to view this booking.");
        }

        return mapBookingToDto(booking);
    }

    public Page<BookingDto> getCustomerBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserIdOrderByBookingTimeDesc(userId, pageable).map(this::mapBookingToDto);
    }

    public Page<BookingDto> getAllBookings(Pageable pageable) {
        return bookingRepository.findAllByOrderByBookingTimeDesc(pageable).map(this::mapBookingToDto);
    }

    private BigDecimal getSettingDecimal(String key, BigDecimal defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(s -> new BigDecimal(s.getSettingValue()))
                .orElse(defaultValue);
    }

    private int getSettingInt(String key, int defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(s -> Integer.parseInt(s.getSettingValue()))
                .orElse(defaultValue);
    }

    private BookingDto mapBookingToDto(Booking b) {
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(b.getId());
        List<Payment> payments = paymentRepository.findByBookingId(b.getId());
        List<Refund> refunds = refundRepository.findByBookingId(b.getId());

        return BookingDto.builder()
                .id(b.getId())
                .pnr(b.getPnr())
                .userId(b.getUser().getId())
                .customerName(b.getUser().getFullName())
                .customerEmail(b.getUser().getEmail())
                .customerPhone(b.getUser().getPhone())
                .tripId(b.getTrip().getId())
                .origin(b.getTrip().getRoute().getOrigin())
                .destination(b.getTrip().getRoute().getDestination())
                .departureTime(b.getTrip().getDepartureTime())
                .arrivalTime(b.getTrip().getArrivalTime())
                .busRegistration(b.getTrip().getBus().getRegistrationNumber())
                .coachTypeName(b.getTrip().getBus().getCoachType().getName())
                .baseFareTotal(b.getBaseFareTotal())
                .taxAmount(b.getTaxAmount())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .bookingTime(b.getBookingTime())
                .seats(seats.stream().map(s -> BookingSeatDto.builder()
                        .id(s.getId())
                        .seatNumber(s.getSeatNumber())
                        .passengerName(s.getPassengerName())
                        .passengerAge(s.getPassengerAge())
                        .passengerGender(s.getPassengerGender())
                        .fare(s.getFare())
                        .status(s.getStatus())
                        .build()).collect(Collectors.toList()))
                .payments(payments.stream().map(p -> PaymentDto.builder()
                        .id(p.getId())
                        .amount(p.getAmount())
                        .paymentMethod(p.getPaymentMethod())
                        .paymentStatus(p.getPaymentStatus())
                        .transactionReference(p.getTransactionReference())
                        .recordedAt(p.getRecordedAt())
                        .build()).collect(Collectors.toList()))
                .refunds(refunds.stream().map(r -> RefundDto.builder()
                        .id(r.getId())
                        .refundAmount(r.getRefundAmount())
                        .refundPercentage(r.getRefundPercentage())
                        .hoursBeforeDeparture(r.getHoursBeforeDeparture())
                        .status(r.getStatus())
                        .processedAt(r.getProcessedAt())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
