package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private Long id;
    private String pnr;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Long tripId;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String busRegistration;
    private String coachTypeName;

    private BigDecimal baseFareTotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime bookingTime;

    private List<BookingSeatDto> seats;
    private List<PaymentDto> payments;
    private List<RefundDto> refunds;
}
