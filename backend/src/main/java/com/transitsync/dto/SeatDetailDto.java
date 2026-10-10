package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDetailDto {
    private String seatNumber; // e.g. "1A", "L1", "U1"
    private String deck;       // LOWER, UPPER
    private int rowNum;
    private int colNum;
    private String seatType;   // SEATER, SLEEPER
    private boolean isAccessible;
    private String status;     // AVAILABLE, BOOKED, RESERVED
    private BigDecimal fare;
}
