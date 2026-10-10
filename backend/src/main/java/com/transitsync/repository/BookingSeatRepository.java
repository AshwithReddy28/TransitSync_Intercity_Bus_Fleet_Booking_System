package com.transitsync.repository;

import com.transitsync.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    
    @Query("SELECT bs.seatNumber FROM BookingSeat bs WHERE bs.trip.id = :tripId AND bs.status = 'ACTIVE'")
    List<String> findActiveBookedSeatNumbersByTripId(@Param("tripId") Long tripId);

    @Query("SELECT bs FROM BookingSeat bs WHERE bs.trip.id = :tripId AND bs.seatNumber IN :seatNumbers AND bs.status = 'ACTIVE'")
    List<BookingSeat> findConflictingSeats(@Param("tripId") Long tripId, @Param("seatNumbers") List<String> seatNumbers);

    List<BookingSeat> findByBookingId(Long bookingId);

    long countByTripIdAndStatus(Long tripId, String status);
}
