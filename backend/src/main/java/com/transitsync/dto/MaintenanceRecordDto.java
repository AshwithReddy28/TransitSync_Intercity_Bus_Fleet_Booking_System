package com.transitsync.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MaintenanceRecordDto {
    private Long id;

    @NotNull(message = "Bus ID is required")
    private Long busId;
    private String busRegistration;

    private String serviceType;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private BigDecimal cost;
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE
    private String notes;
}
