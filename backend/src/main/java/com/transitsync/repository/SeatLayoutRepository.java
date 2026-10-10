package com.transitsync.repository;

import com.transitsync.entity.SeatLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatLayoutRepository extends JpaRepository<SeatLayout, Long> {
    List<SeatLayout> findByBusIdOrderByDeckAscRowNumAscColNumAsc(Long busId);
    void deleteByBusId(Long busId);
    long countByBusId(Long busId);
}
