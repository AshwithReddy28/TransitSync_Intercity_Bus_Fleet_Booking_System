package com.transitsync.repository;

import com.transitsync.entity.CoachType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoachTypeRepository extends JpaRepository<CoachType, Long> {
    Optional<CoachType> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByName(String name);
}
