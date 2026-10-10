package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundDto {
    private Long id;
    private BigDecimal refundAmount;
    private BigDecimal refundPercentage;
    private BigDecimal hoursBeforeDeparture;
    private String status;
    private LocalDateTime processedAt;
}
