package com.transitsync.service;

import com.transitsync.dto.TripDto;
import com.transitsync.entity.Bus;
import com.transitsync.entity.Driver;
import com.transitsync.entity.Route;
import com.transitsync.entity.Trip;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.BookingSeatRepository;
import com.transitsync.repository.BusRepository;
import com.transitsync.repository.DriverRepository;
import com.transitsync.repository.RouteRepository;
import com.transitsync.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final RouteRepository routeRepository;
    private final BusRepository busRepository;
    private final DriverRepository driverRepository;
    private final BookingSeatRepository bookingSeatRepository;

    public Page<TripDto> getAllTrips(Pageable pageable) {
        return tripRepository.findAll(pageable).map(this::mapTripToDto);
    }

    public TripDto getTripById(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        return mapTripToDto(trip);
    }

    public List<TripDto> searchTrips(String origin, String destination, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Trip> trips = tripRepository.searchTrips(origin.trim(), destination.trim(), startOfDay, endOfDay);
        return trips.stream()
                .filter(t -> t.getDepartureTime().isAfter(LocalDateTime.now()))
                .map(this::mapTripToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripDto createTrip(TripDto dto) {
        if (dto.getArrivalTime().isBefore(dto.getDepartureTime())) {
            throw new BadRequestException("Arrival time cannot be before departure time.");
        }

        Route route = routeRepository.findById(dto.getRouteId())
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + dto.getRouteId()));

        Bus bus = busRepository.findById(dto.getBusId())
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + dto.getBusId()));

        if (!"ACTIVE".equalsIgnoreCase(bus.getStatus())) {
            throw new BadRequestException("Selected bus is not ACTIVE. Current status: " + bus.getStatus());
        }

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + dto.getDriverId()));

        if (!"ACTIVE".equalsIgnoreCase(driver.getStatus())) {
            throw new BadRequestException("Selected driver is not ACTIVE.");
        }

        // Prevent overlapping trips for the bus
        List<Trip> conflictingBusTrips = tripRepository.findConflictingTripsForBus(bus.getId(), dto.getDepartureTime(), dto.getArrivalTime());
        if (!conflictingBusTrips.isEmpty()) {
            throw new ConflictException("Bus " + bus.getRegistrationNumber() + " is already assigned to a trip during this time window.");
        }

        // Prevent overlapping trips for the driver
        List<Trip> conflictingDriverTrips = tripRepository.findConflictingTripsForDriver(driver.getId(), dto.getDepartureTime(), dto.getArrivalTime());
        if (!conflictingDriverTrips.isEmpty()) {
            throw new ConflictException("Driver " + driver.getName() + " is already scheduled for a trip during this time window.");
        }

        Trip trip = Trip.builder()
                .route(route)
                .bus(bus)
                .driver(driver)
                .departureTime(dto.getDepartureTime())
                .arrivalTime(dto.getArrivalTime())
                .baseFare(dto.getBaseFare())
                .status("SCHEDULED")
                .build();

        return mapTripToDto(tripRepository.save(trip));
    }

    @Transactional
    public TripDto cancelTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));

        trip.setStatus("CANCELLED");
        return mapTripToDto(tripRepository.save(trip));
    }

    private TripDto mapTripToDto(Trip t) {
        TripDto dto = new TripDto();
        dto.setId(t.getId());
        dto.setRouteId(t.getRoute().getId());
        dto.setOrigin(t.getRoute().getOrigin());
        dto.setDestination(t.getRoute().getDestination());
        dto.setBusId(t.getBus().getId());
        dto.setBusRegistration(t.getBus().getRegistrationNumber());
        dto.setCoachTypeName(t.getBus().getCoachType().getName());
        dto.setCoachTypeCode(t.getBus().getCoachType().getCode());
        dto.setModelName(t.getBus().getModelName());
        dto.setAmenities(t.getBus().getAmenities());
        dto.setHasAc(t.getBus().getCoachType().isHasAc());
        dto.setDriverId(t.getDriver().getId());
        dto.setDriverName(t.getDriver().getName());
        dto.setDepartureTime(t.getDepartureTime());
        dto.setArrivalTime(t.getArrivalTime());
        dto.setBaseFare(t.getBaseFare());
        dto.setStatus(t.getStatus());

        int totalSeats = t.getBus().getTotalCapacity();
        long bookedSeats = bookingSeatRepository.countByTripIdAndStatus(t.getId(), "ACTIVE");
        dto.setTotalSeats(totalSeats);
        dto.setAvailableSeats(Math.max(0, totalSeats - (int) bookedSeats));
        return dto;
    }
}
