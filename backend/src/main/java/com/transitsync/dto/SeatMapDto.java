package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapDto {
    private Long tripId;
    private Long busId;
    private String coachTypeName;
    private int decks;
    private BigDecimal baseFare;
    private BigDecimal taxRatePercent;
    private BigDecimal serviceFee;
    private int maxSeatsPerBooking;
    private List<SeatDetailDto> seats;
}
