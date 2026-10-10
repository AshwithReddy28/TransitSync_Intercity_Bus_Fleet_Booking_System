package com.transitsync.repository;

import com.transitsync.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByPnr(String pnr);
    Optional<Booking> findByIdempotencyKey(String idempotencyKey);
    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);
    Page<Booking> findByUserIdOrderByBookingTimeDesc(Long userId, Pageable pageable);
    Page<Booking> findAllByOrderByBookingTimeDesc(Pageable pageable);
    
    long countByBookingTimeBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'CONFIRMED' AND b.bookingTime >= :since")
    long countConfirmedBookingsSince(@Param("since") LocalDateTime since);

    @Query("SELECT b FROM Booking b WHERE b.trip.id = :tripId AND b.status = 'CONFIRMED'")
    List<Booking> findConfirmedBookingsByTripId(@Param("tripId") Long tripId);
}
