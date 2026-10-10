package com.transitsync.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BusDto {
    private Long id;

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotNull(message = "Coach type ID is required")
    private Long coachTypeId;

    private String coachTypeName;
    private String coachTypeCode;
    private int decks;

    private String modelName;

    @Min(value = 1, message = "Total capacity must be at least 1")
    private int totalCapacity;

    private String amenities;
    private String status = "ACTIVE"; // ACTIVE, IN_MAINTENANCE, RETIRED

    private List<SeatLayoutDto> seatLayouts;
}
