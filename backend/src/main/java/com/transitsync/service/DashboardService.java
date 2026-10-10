package com.transitsync.service;

import com.transitsync.dto.BookingDto;
import com.transitsync.dto.DashboardStatsDto;
import com.transitsync.dto.MaintenanceRecordDto;
import com.transitsync.entity.Trip;
import com.transitsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final PaymentRepository paymentRepository;
    private final MaintenanceRecordRepository maintenanceRepository;
    private final MaintenanceService maintenanceService;
    private final BookingService bookingService;

    public DashboardStatsDto getLiveDashboardStats() {
        long totalBuses = busRepository.count();
        long busesInMaintenance = busRepository.countByStatus("IN_MAINTENANCE");
        long upcomingTrips = tripRepository.countByStatus("SCHEDULED");

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);
        long bookingsToday = bookingRepository.countByBookingTimeBetween(startOfToday, endOfToday);

        // Real calculated revenue for the last 30 days
        LocalDateTime thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay();
        BigDecimal totalRevenue = paymentRepository.sumRevenueBetween(thirtyDaysAgo, LocalDateTime.now());

        // Real daily revenue array for charts (last 7 days)
        List<Map<String, Object>> revenueHistory = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = d.atStartOfDay();
            LocalDateTime dayEnd = d.atTime(LocalTime.MAX);
            BigDecimal dayRev = paymentRepository.sumRevenueBetween(dayStart, dayEnd);

            Map<String, Object> map = new HashMap<>();
            map.put("date", d.toString());
            map.put("revenue", dayRev);
            revenueHistory.add(map);
        }

        // Live trip occupancy calculation
        List<Trip> recentScheduledTrips = tripRepository.findAll(PageRequest.of(0, 5)).getContent();
        List<Map<String, Object>> tripOccupancy = recentScheduledTrips.stream().map(trip -> {
            int total = trip.getBus().getTotalCapacity();
            long booked = bookingSeatRepository.countByTripIdAndStatus(trip.getId(), "ACTIVE");
            double rate = total > 0 ? (double) booked / total * 100.0 : 0.0;

            Map<String, Object> map = new HashMap<>();
            map.put("tripId", trip.getId());
            map.put("route", trip.getRoute().getOrigin() + " -> " + trip.getRoute().getDestination());
            map.put("occupancyPercent", Math.round(rate * 10.0) / 10.0);
            map.put("bookedSeats", booked);
            map.put("totalSeats", total);
            return map;
        }).collect(Collectors.toList());

        // Upcoming maintenance
        List<MaintenanceRecordDto> upcomingMaint = maintenanceRepository
                .findByStatusAndScheduledDateLessThanEqual("SCHEDULED", LocalDate.now().plusDays(14))
                .stream()
                .map(maintenanceService::mapToDto)
                .collect(Collectors.toList());

        // Recent bookings
        List<BookingDto> recentBookings = bookingRepository
                .findAllByOrderByBookingTimeDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(b -> bookingService.getBookingById(b.getId(), null, true))
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalBuses(totalBuses)
                .busesInMaintenance(busesInMaintenance)
                .upcomingTrips(upcomingTrips)
                .bookingsToday(bookingsToday)
                .totalRevenue(totalRevenue)
                .revenueHistory(revenueHistory)
                .tripOccupancy(tripOccupancy)
                .upcomingMaintenance(upcomingMaint)
                .recentBookings(recentBookings)
                .build();
    }
}
