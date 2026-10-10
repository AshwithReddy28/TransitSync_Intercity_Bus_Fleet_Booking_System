package com.transitsync.service;

import com.transitsync.dto.MaintenanceRecordDto;
import com.transitsync.entity.Bus;
import com.transitsync.entity.MaintenanceRecord;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.BusRepository;
import com.transitsync.repository.MaintenanceRecordRepository;
import com.transitsync.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRepository;
    private final BusRepository busRepository;
    private final TripRepository tripRepository;

    public Page<MaintenanceRecordDto> getAllMaintenance(Pageable pageable) {
        return maintenanceRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional
    public MaintenanceRecordDto scheduleMaintenance(MaintenanceRecordDto dto) {
        Bus bus = busRepository.findById(dto.getBusId())
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + dto.getBusId()));

        // Warn/prevent if upcoming scheduled trips exist during the service date
        var futureTrips = tripRepository.findByBusIdAndDepartureTimeAfterAndStatusNot(bus.getId(), LocalDateTime.now(), "CANCELLED");
        if (!futureTrips.isEmpty() && dto.getScheduledDate().isBefore(LocalDate.now().plusDays(2))) {
            bus.setStatus("IN_MAINTENANCE");
            busRepository.save(bus);
        }

        MaintenanceRecord record = MaintenanceRecord.builder()
                .bus(bus)
                .serviceType(dto.getServiceType().trim())
                .scheduledDate(dto.getScheduledDate())
                .cost(dto.getCost() != null ? dto.getCost() : BigDecimal.ZERO)
                .status("SCHEDULED")
                .notes(dto.getNotes())
                .build();

        return mapToDto(maintenanceRepository.save(record));
    }

    @Transactional
    public MaintenanceRecordDto completeMaintenance(Long id, MaintenanceRecordDto dto) {
        MaintenanceRecord record = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found with id: " + id));

        record.setStatus("COMPLETED");
        record.setCompletedDate(dto.getCompletedDate() != null ? dto.getCompletedDate() : LocalDate.now());
        if (dto.getCost() != null) {
            record.setCost(dto.getCost());
        }
        if (dto.getNotes() != null) {
            record.setNotes(dto.getNotes());
        }

        // Return bus to ACTIVE if currently in maintenance
        Bus bus = record.getBus();
        if ("IN_MAINTENANCE".equalsIgnoreCase(bus.getStatus())) {
            bus.setStatus("ACTIVE");
            busRepository.save(bus);
        }

        return mapToDto(maintenanceRepository.save(record));
    }

    public MaintenanceRecordDto mapToDto(MaintenanceRecord r) {
        MaintenanceRecordDto dto = new MaintenanceRecordDto();
        dto.setId(r.getId());
        dto.setBusId(r.getBus().getId());
        dto.setBusRegistration(r.getBus().getRegistrationNumber());
        dto.setServiceType(r.getServiceType());
        dto.setScheduledDate(r.getScheduledDate());
        dto.setCompletedDate(r.getCompletedDate());
        dto.setCost(r.getCost());
        dto.setStatus(r.getStatus());
        dto.setNotes(r.getNotes());
        return dto;
    }
}
