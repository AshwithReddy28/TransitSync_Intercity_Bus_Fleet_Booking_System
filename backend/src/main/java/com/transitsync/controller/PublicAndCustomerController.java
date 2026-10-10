package com.transitsync.controller;

import com.transitsync.dto.BookingDto;
import com.transitsync.dto.BookingRequest;
import com.transitsync.dto.SeatMapDto;
import com.transitsync.dto.TripDto;
import com.transitsync.security.CustomUserDetails;
import com.transitsync.service.BookingService;
import com.transitsync.service.DriverAndRouteService;
import com.transitsync.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Customer & Public APIs", description = "Endpoints for searching trips, viewing seat maps, booking, and managing tickets")
public class PublicAndCustomerController {

    private final TripService tripService;
    private final BookingService bookingService;
    private final DriverAndRouteService driverAndRouteService;

    @GetMapping("/cities")
    @Operation(summary = "Get matching valid cities and bus stops for auto-suggestion")
    public ResponseEntity<List<String>> getCities(@RequestParam(required = false, defaultValue = "") String query) {
        List<String> validPlaces = List.of(
            "Hyderabad", "MGBS Bus Station (Hyderabad)", "Jubilee Bus Station (JBS - Hyderabad)",
            "Karimnagar", "Adilabad", "Delhi", "Bengaluru", "Chennai", "Mumbai", "Pune",
            "Goa", "Vijayawada", "Visakhapatnam", "Tirupati", "Coimbatore", "Kochi", "Mysuru", 
            "Ahmedabad", "Jaipur", "Kolkata", "Nagpur", "Indore", "Surat", "Bhopal", "Warangal", "Nizamabad"
        );
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(validPlaces);
        }
        String q = query.trim().toLowerCase();
        List<String> matched = validPlaces.stream()
                .filter(place -> place.toLowerCase().contains(q))
                .toList();
        return ResponseEntity.ok(matched);
    }

    @GetMapping("/routes/active")
    @Operation(summary = "Get list of active routes for public trip search")
    public ResponseEntity<List<com.transitsync.dto.RouteDto>> getActiveRoutes() {
        return ResponseEntity.ok(driverAndRouteService.getActiveRoutes());
    }

    @GetMapping("/trips/search")
    @Operation(summary = "Search upcoming trips by origin, destination, and departure date")
    public ResponseEntity<List<TripDto>> searchTrips(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(tripService.searchTrips(origin, destination, date));
    }

    @GetMapping("/trips/{id}")
    @Operation(summary = "Get single trip details")
    public ResponseEntity<TripDto> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @GetMapping("/trips/{tripId}/seat-map")
    @Operation(summary = "Get interactive seat map layout and live seat availability for a trip")
    public ResponseEntity<SeatMapDto> getSeatMap(@PathVariable Long tripId) {
        return ResponseEntity.ok(bookingService.getSeatMapForTrip(tripId));
    }

    @PostMapping("/bookings")
    @Operation(summary = "Book selected seats with passenger details")
    public ResponseEntity<BookingDto> createBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingRequest request) {
        return new ResponseEntity<>(bookingService.createBooking(userDetails.getId(), request), HttpStatus.CREATED);
    }

    @GetMapping("/bookings/my-bookings")
    @Operation(summary = "Get current customer's booking history")
    public ResponseEntity<Page<BookingDto>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getCustomerBookings(userDetails.getId(), PageRequest.of(page, size)));
    }

    @GetMapping("/bookings/{id}")
    @Operation(summary = "Get booking details by ID (enforces ownership check)")
    public ResponseEntity<BookingDto> getBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(bookingService.getBookingById(id, userDetails.getId(), isAdmin));
    }

    @PostMapping("/bookings/{id}/cancel")
    @Operation(summary = "Cancel booking with server-side refund policy calculation")
    public ResponseEntity<BookingDto> cancelBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(bookingService.cancelBooking(id, userDetails.getId(), isAdmin));
    }
}
