package com.transitsync.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TripDto {
    private Long id;

    @NotNull(message = "Route ID is required")
    private Long routeId;
    private String origin;
    private String destination;

    @NotNull(message = "Bus ID is required")
    private Long busId;
    private String busRegistration;
    private String coachTypeName;
    private String coachTypeCode;
    private String modelName;
    private String amenities;
    private boolean hasAc;

    @NotNull(message = "Driver ID is required")
    private Long driverId;
    private String driverName;

    @NotNull(message = "Departure time is required")
    private LocalDateTime departureTime;

    @NotNull(message = "Arrival time is required")
    private LocalDateTime arrivalTime;

    @NotNull(message = "Base fare is required")
    @DecimalMin(value = "10.0", message = "Base fare must be at least 10")
    private BigDecimal baseFare;

    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, CANCELLED

    private int totalSeats;
    private int availableSeats;
}
