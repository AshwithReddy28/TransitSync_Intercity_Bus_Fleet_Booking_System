package com.transitsync.controller;

import com.transitsync.dto.AuthResponse;
import com.transitsync.dto.LoginRequest;
import com.transitsync.dto.RegisterRequest;
import com.transitsync.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Separate authentication endpoints for Customers and Administrators")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/customer/register")
    @Operation(summary = "Register a new customer")
    public ResponseEntity<?> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        try {
            return new ResponseEntity<>(authService.registerCustomer(request), HttpStatus.CREATED);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuthController.class).error("CRITICAL REGISTER ERROR: ", e);
            throw e;
        }
    }

    @PostMapping("/customer/login")
    @Operation(summary = "Customer login endpoint (rejects admin accounts)")
    public ResponseEntity<AuthResponse> loginCustomer(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCustomer(request));
    }

    @PostMapping("/admin/login")
    @Operation(summary = "Admin login endpoint (rejects customer accounts)")
    public ResponseEntity<AuthResponse> loginAdmin(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginAdmin(request));
    }
}
