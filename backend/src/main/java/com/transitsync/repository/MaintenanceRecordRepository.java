package com.transitsync.repository;

import com.transitsync.entity.MaintenanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByBusId(Long busId);
    Page<MaintenanceRecord> findAll(Pageable pageable);
    List<MaintenanceRecord> findByStatusAndScheduledDateLessThanEqual(String status, LocalDate date);
    long countByStatus(String status);
}
