package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatLayoutDto {
    private Long id;
    private String deck; // LOWER, UPPER
    private int rowNum;
    private int colNum;
    private String seatNumber; // e.g., 1A, 1B, L1, U1
    private String seatType; // SEATER, SLEEPER
    private boolean isAccessible;
}
