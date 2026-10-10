package com.transitsync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BookingRequest {
    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotEmpty(message = "At least one passenger must be selected")
    @Valid
    private List<PassengerDetailDto> passengers;

    private String paymentMethod = "UPI"; // UPI, CARD, NET_BANKING
    private String idempotencyKey;
}
