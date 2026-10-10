package com.transitsync.repository;

import com.transitsync.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleNameAndStatus(String roleName, String status);
    Page<User> findByRoleName(String roleName, Pageable pageable);
    Page<User> findByRoleNameAndFullNameContainingIgnoreCaseOrRoleNameAndEmailContainingIgnoreCase(
        String role1, String name, String role2, String email, Pageable pageable
    );
}
