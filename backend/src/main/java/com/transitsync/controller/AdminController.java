package com.transitsync.controller;

import com.transitsync.dto.*;
import com.transitsync.entity.AuditLog;
import com.transitsync.entity.User;
import com.transitsync.repository.AuditLogRepository;
import com.transitsync.security.CustomUserDetails;
import com.transitsync.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Operations", description = "Fleet, Trips, Drivers, Maintenance, Bookings, Users, Settings and Reports")
public class AdminController {

    private final DashboardService dashboardService;
    private final FleetService fleetService;
    private final DriverAndRouteService driverAndRouteService;
    private final TripService tripService;
    private final BookingService bookingService;
    private final MaintenanceService maintenanceService;
    private final AdminManagementService adminManagementService;
    private final AuditLogRepository auditLogRepository;

    // --- Dashboard & Reports ---
    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get live dashboard statistics and revenue metrics")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getLiveDashboardStats());
    }

    @GetMapping("/reports/bookings/export-csv")
    @Operation(summary = "Export bookings data to CSV")
    public ResponseEntity<byte[]> exportBookingsCsv() {
        Page<BookingDto> bookings = bookingService.getAllBookings(PageRequest.of(0, 1000, Sort.by("bookingTime").descending()));
        StringBuilder csv = new StringBuilder();
        csv.append("PNR,Customer,Trip Route,Departure Time,Seats,Total Amount,Status,Booking Date\n");
        for (BookingDto b : bookings.getContent()) {
            String seatNums = b.getSeats() != null ? String.join(";", b.getSeats().stream().map(BookingSeatDto::getSeatNumber).toList()) : "";
            csv.append(String.format("\"%s\",\"%s\",\"%s -> %s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    b.getPnr(),
                    b.getCustomerName(),
                    b.getOrigin(),
                    b.getDestination(),
                    b.getDepartureTime(),
                    seatNums,
                    b.getTotalAmount(),
                    b.getStatus(),
                    b.getBookingTime()
            ));
        }

        byte[] output = csv.toString().getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transitsync_bookings_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(output);
    }

    // --- Fleet Management ---
    @GetMapping("/buses")
    public ResponseEntity<Page<BusDto>> getAllBuses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(fleetService.getAllBuses(PageRequest.of(page, size)));
    }

    @PostMapping("/buses")
    public ResponseEntity<BusDto> createBus(@Valid @RequestBody BusDto dto) {
        return new ResponseEntity<>(fleetService.createBus(dto), HttpStatus.CREATED);
    }

    @PutMapping("/buses/{id}")
    public ResponseEntity<BusDto> updateBus(@PathVariable Long id, @Valid @RequestBody BusDto dto) {
        return ResponseEntity.ok(fleetService.updateBus(id, dto));
    }

    @DeleteMapping("/buses/{id}")
    public ResponseEntity<Void> archiveBus(@PathVariable Long id) {
        fleetService.archiveBus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/coach-types")
    public ResponseEntity<List<CoachTypeDto>> getCoachTypes() {
        return ResponseEntity.ok(fleetService.getAllCoachTypes());
    }

    @PostMapping("/coach-types")
    public ResponseEntity<CoachTypeDto> createCoachType(@Valid @RequestBody CoachTypeDto dto) {
        return new ResponseEntity<>(fleetService.createCoachType(dto), HttpStatus.CREATED);
    }

    // --- Drivers ---
    @GetMapping("/drivers")
    public ResponseEntity<Page<DriverDto>> getDrivers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(driverAndRouteService.getAllDrivers(PageRequest.of(page, size)));
    }

    @GetMapping("/drivers/active")
    public ResponseEntity<List<DriverDto>> getActiveDrivers() {
        return ResponseEntity.ok(driverAndRouteService.getActiveDrivers());
    }

    @PostMapping("/drivers")
    public ResponseEntity<DriverDto> createDriver(@Valid @RequestBody DriverDto dto) {
        return new ResponseEntity<>(driverAndRouteService.createDriver(dto), HttpStatus.CREATED);
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<DriverDto> updateDriver(@PathVariable Long id, @Valid @RequestBody DriverDto dto) {
        return ResponseEntity.ok(driverAndRouteService.updateDriver(id, dto));
    }

    // --- Routes ---
    @GetMapping("/routes")
    public ResponseEntity<Page<RouteDto>> getRoutes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(driverAndRouteService.getAllRoutes(PageRequest.of(page, size)));
    }

    @GetMapping("/routes/active")
    public ResponseEntity<List<RouteDto>> getActiveRoutes() {
        return ResponseEntity.ok(driverAndRouteService.getActiveRoutes());
    }

    @PostMapping("/routes")
    public ResponseEntity<RouteDto> createRoute(@Valid @RequestBody RouteDto dto) {
        return new ResponseEntity<>(driverAndRouteService.createRoute(dto), HttpStatus.CREATED);
    }

    // --- Trips ---
    @GetMapping("/trips")
    public ResponseEntity<Page<TripDto>> getTrips(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(tripService.getAllTrips(PageRequest.of(page, size, Sort.by("departureTime").descending())));
    }

    @PostMapping("/trips")
    public ResponseEntity<TripDto> createTrip(@Valid @RequestBody TripDto dto) {
        return new ResponseEntity<>(tripService.createTrip(dto), HttpStatus.CREATED);
    }

    @PostMapping("/trips/{id}/cancel")
    public ResponseEntity<TripDto> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }

    // --- Bookings ---
    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingDto>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(PageRequest.of(page, size)));
    }

    // --- Maintenance ---
    @GetMapping("/maintenance")
    public ResponseEntity<Page<MaintenanceRecordDto>> getMaintenance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(maintenanceService.getAllMaintenance(PageRequest.of(page, size)));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceRecordDto> scheduleMaintenance(@Valid @RequestBody MaintenanceRecordDto dto) {
        return new ResponseEntity<>(maintenanceService.scheduleMaintenance(dto), HttpStatus.CREATED);
    }

    @PutMapping("/maintenance/{id}/complete")
    public ResponseEntity<MaintenanceRecordDto> completeMaintenance(
            @PathVariable Long id,
            @RequestBody MaintenanceRecordDto dto) {
        return ResponseEntity.ok(maintenanceService.completeMaintenance(id, dto));
    }

    @GetMapping("/customers")
    public ResponseEntity<Page<User>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminManagementService.getAllCustomers(PageRequest.of(page, size)));
    }

    @PutMapping("/customers/{id}")
    @Operation(summary = "Admin update customer profile details")
    public ResponseEntity<User> updateCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminManagementService.updateCustomer(
                id,
                body.get("fullName"),
                body.get("phone"),
                body.get("email")
        ));
    }

    @PostMapping("/customers/{id}/reset-password")
    @Operation(summary = "Admin reset customer password")
    public ResponseEntity<Void> resetCustomerPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        adminManagementService.resetCustomerPassword(id, body.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/customers/{id}")
    @Operation(summary = "Admin deactivate/delete customer")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        adminManagementService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admins")
    public ResponseEntity<Page<User>> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminManagementService.getAllAdmins(PageRequest.of(page, size)));
    }

    @PostMapping("/admins")
    public ResponseEntity<User> createAdmin(@RequestBody Map<String, String> body) {
        return new ResponseEntity<>(adminManagementService.createAdmin(
                body.get("email"),
                body.get("password"),
                body.get("fullName"),
                body.get("phone")
        ), HttpStatus.CREATED);
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<User> toggleUserStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminManagementService.toggleUserStatus(id, userDetails.getId()));
    }

    // --- Settings & Audit ---
    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings() {
        return ResponseEntity.ok(adminManagementService.getAllSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<Void> updateSetting(@RequestBody Map<String, String> body) {
        body.forEach(adminManagementService::updateSetting);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)));
    }
}
