package com.transitsync.service;

import com.transitsync.dto.AuthResponse;
import com.transitsync.dto.LoginRequest;
import com.transitsync.dto.RegisterRequest;
import com.transitsync.entity.Role;
import com.transitsync.entity.User;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ForbiddenException;
import com.transitsync.repository.RoleRepository;
import com.transitsync.repository.UserRepository;
import com.transitsync.security.CustomUserDetails;
import com.transitsync.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered. Please log in.");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").build()));

        User user = User.builder()
                .email(email)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(customerRole)
                .status("ACTIVE")
                .failedLoginAttempts(0)
                .build();

        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtUtil.generateToken(userDetails, user.getId(), customerRole.getName(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(customerRole.getName())
                .build();
    }

    @Transactional
    public AuthResponse loginCustomer(LoginRequest request) {
        User user = validateAndAuthenticate(request.getEmail(), request.getPassword());

        if (!"ROLE_CUSTOMER".equalsIgnoreCase(user.getRole().getName())) {
            throw new ForbiddenException("Admin accounts must use the dedicated Admin Portal to log in.");
        }

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtUtil.generateToken(userDetails, user.getId(), user.getRole().getName(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .build();
    }

    @Transactional
    public AuthResponse loginAdmin(LoginRequest request) {
        User user = validateAndAuthenticate(request.getEmail(), request.getPassword());

        if (!"ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            throw new ForbiddenException("Access Denied: Customer accounts cannot access the Admin Portal.");
        }

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtUtil.generateToken(userDetails, user.getId(), user.getRole().getName(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .build();
    }

    private User validateAndAuthenticate(String emailInput, String rawPassword) {
        String email = emailInput.trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ForbiddenException("Account is currently disabled or suspended. Please contact support.");
        }

        if (user.getLockoutUntil() != null && LocalDateTime.now().isBefore(user.getLockoutUntil())) {
            throw new ForbiddenException("Account temporarily locked due to multiple failed login attempts. Please try again later.");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Reset failed login attempts on success
        if (user.getFailedLoginAttempts() > 0 || user.getLockoutUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
        }

        return user;
    }
}
