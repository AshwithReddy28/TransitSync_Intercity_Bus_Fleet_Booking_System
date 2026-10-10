package com.transitsync.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RouteDto {
    private Long id;

    @NotBlank(message = "Origin city is required")
    private String origin;

    @NotBlank(message = "Destination city is required")
    private String destination;

    @NotNull(message = "Distance in km is required")
    @DecimalMin(value = "1.0", message = "Distance must be at least 1 km")
    private BigDecimal distanceKm;

    @Min(value = 10, message = "Estimated duration must be at least 10 minutes")
    private int estimatedDurationMinutes;

    private String status = "ACTIVE";
}
