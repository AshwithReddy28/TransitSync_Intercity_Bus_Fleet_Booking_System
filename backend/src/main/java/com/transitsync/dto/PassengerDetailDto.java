package com.transitsync.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PassengerDetailDto {
    @NotBlank(message = "Seat number is required")
    private String seatNumber;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @Min(value = 1, message = "Passenger age must be at least 1")
    @Max(value = 120, message = "Passenger age must be valid")
    private int passengerAge;

    @NotBlank(message = "Gender is required")
    private String passengerGender;
}
