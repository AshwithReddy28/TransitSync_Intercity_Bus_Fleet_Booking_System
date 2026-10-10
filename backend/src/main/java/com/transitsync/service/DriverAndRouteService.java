package com.transitsync.service;

import com.transitsync.dto.DriverDto;
import com.transitsync.dto.RouteDto;
import com.transitsync.entity.Driver;
import com.transitsync.entity.Route;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.DriverRepository;
import com.transitsync.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverAndRouteService {

    private final DriverRepository driverRepository;
    private final RouteRepository routeRepository;

    // --- Drivers ---
    public Page<DriverDto> getAllDrivers(Pageable pageable) {
        return driverRepository.findAll(pageable).map(this::mapDriverToDto);
    }

    public List<DriverDto> getActiveDrivers() {
        return driverRepository.findByStatus("ACTIVE").stream().map(this::mapDriverToDto).collect(Collectors.toList());
    }

    @Transactional
    public DriverDto createDriver(DriverDto dto) {
        String license = dto.getLicenseNumber().trim().toUpperCase();
        if (driverRepository.existsByLicenseNumber(license)) {
            throw new ConflictException("Driver license number already exists: " + license);
        }

        Driver driver = Driver.builder()
                .name(dto.getName().trim())
                .licenseNumber(license)
                .phone(dto.getPhone().trim())
                .status("ACTIVE")
                .build();

        return mapDriverToDto(driverRepository.save(driver));
    }

    @Transactional
    public DriverDto updateDriver(Long id, DriverDto dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));

        driver.setName(dto.getName().trim());
        driver.setPhone(dto.getPhone().trim());
        driver.setStatus(dto.getStatus());
        return mapDriverToDto(driverRepository.save(driver));
    }

    // --- Routes ---
    public Page<RouteDto> getAllRoutes(Pageable pageable) {
        return routeRepository.findAll(pageable).map(this::mapRouteToDto);
    }

    public List<RouteDto> getActiveRoutes() {
        return routeRepository.findByStatus("ACTIVE").stream().map(this::mapRouteToDto).collect(Collectors.toList());
    }

    @Transactional
    public RouteDto createRoute(RouteDto dto) {
        String origin = dto.getOrigin().trim();
        String destination = dto.getDestination().trim();

        if (routeRepository.existsByOriginIgnoreCaseAndDestinationIgnoreCase(origin, destination)) {
            throw new ConflictException("Route from " + origin + " to " + destination + " already exists.");
        }

        Route route = Route.builder()
                .origin(origin)
                .destination(destination)
                .distanceKm(dto.getDistanceKm())
                .estimatedDurationMinutes(dto.getEstimatedDurationMinutes())
                .status("ACTIVE")
                .build();

        return mapRouteToDto(routeRepository.save(route));
    }

    private DriverDto mapDriverToDto(Driver d) {
        DriverDto dto = new DriverDto();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setLicenseNumber(d.getLicenseNumber());
        dto.setPhone(d.getPhone());
        dto.setStatus(d.getStatus());
        return dto;
    }

    private RouteDto mapRouteToDto(Route r) {
        RouteDto dto = new RouteDto();
        dto.setId(r.getId());
        dto.setOrigin(r.getOrigin());
        dto.setDestination(r.getDestination());
        dto.setDistanceKm(r.getDistanceKm());
        dto.setEstimatedDurationMinutes(r.getEstimatedDurationMinutes());
        dto.setStatus(r.getStatus());
        return dto;
    }
}
