package com.transitsync.repository;

import com.transitsync.entity.Trip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    @Query("SELECT t FROM Trip t WHERE t.bus.id = :busId AND t.status != 'CANCELLED' AND " +
           "((t.departureTime <= :arrivalTime AND t.arrivalTime >= :departureTime))")
    List<Trip> findConflictingTripsForBus(@Param("busId") Long busId,
                                         @Param("departureTime") LocalDateTime departureTime,
                                         @Param("arrivalTime") LocalDateTime arrivalTime);

    @Query("SELECT t FROM Trip t WHERE t.driver.id = :driverId AND t.status != 'CANCELLED' AND " +
           "((t.departureTime <= :arrivalTime AND t.arrivalTime >= :departureTime))")
    List<Trip> findConflictingTripsForDriver(@Param("driverId") Long driverId,
                                            @Param("departureTime") LocalDateTime departureTime,
                                            @Param("arrivalTime") LocalDateTime arrivalTime);

    @Query("SELECT t FROM Trip t WHERE " +
           "(LOWER(t.route.origin) = LOWER(:origin) OR LOWER(t.route.origin) LIKE LOWER(CONCAT('%', :origin, '%')) OR LOWER(:origin) LIKE LOWER(CONCAT('%', t.route.origin, '%'))) AND " +
           "(LOWER(t.route.destination) = LOWER(:destination) OR LOWER(t.route.destination) LIKE LOWER(CONCAT('%', :destination, '%')) OR LOWER(:destination) LIKE LOWER(CONCAT('%', t.route.destination, '%'))) AND " +
           "t.departureTime BETWEEN :startOfDay AND :endOfDay AND " +
           "t.status = 'SCHEDULED'")
    List<Trip> searchTrips(@Param("origin") String origin,
                           @Param("destination") String destination,
                           @Param("startOfDay") LocalDateTime startOfDay,
                           @Param("endOfDay") LocalDateTime endOfDay);

    List<Trip> findByBusIdAndDepartureTimeAfterAndStatusNot(Long busId, LocalDateTime time, String status);

    Page<Trip> findAll(Pageable pageable);

    long countByStatus(String status);
}
