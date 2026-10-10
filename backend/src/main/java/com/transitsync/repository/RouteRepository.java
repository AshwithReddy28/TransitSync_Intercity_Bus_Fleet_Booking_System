package com.transitsync.repository;

import com.transitsync.entity.Route;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findByOriginIgnoreCaseAndDestinationIgnoreCase(String origin, String destination);
    boolean existsByOriginIgnoreCaseAndDestinationIgnoreCase(String origin, String destination);
    List<Route> findByStatus(String status);
    Page<Route> findAll(Pageable pageable);
}
