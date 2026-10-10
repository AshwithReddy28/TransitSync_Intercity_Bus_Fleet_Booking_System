package com.transitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalBuses;
    private long busesInMaintenance;
    private long upcomingTrips;
    private long bookingsToday;
    private BigDecimal totalRevenue;
    private List<Map<String, Object>> revenueHistory; // Real calculated daily revenue
    private List<Map<String, Object>> tripOccupancy;  // Real trip occupancy rates
    private List<MaintenanceRecordDto> upcomingMaintenance;
    private List<BookingDto> recentBookings;
}
