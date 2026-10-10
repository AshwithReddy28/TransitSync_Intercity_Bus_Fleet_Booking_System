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
public class BookingSeatDto {
    private Long id;
    private String seatNumber;
    private String passengerName;
    private int passengerAge;
    private String passengerGender;
    private BigDecimal fare;
    private String status;
}
