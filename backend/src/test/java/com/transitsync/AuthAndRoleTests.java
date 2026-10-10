package com.transitsync;

import com.transitsync.dto.AuthResponse;
import com.transitsync.dto.LoginRequest;
import com.transitsync.dto.RegisterRequest;
import com.transitsync.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthAndRoleTests {

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Customer registration and login succeeds")
    void testCustomerRegisterAndLogin() {
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Rohan Kumar");
        register.setEmail("rohan@example.com");
        register.setPassword("Password123!");
        register.setPhone("+91 9876543210");

        AuthResponse regResponse = authService.registerCustomer(register);
        assertNotNull(regResponse.getToken());
        assertEquals("ROLE_CUSTOMER", regResponse.getRole());

        LoginRequest login = new LoginRequest();
        login.setEmail("rohan@example.com");
        login.setPassword("Password123!");

        AuthResponse logResponse = authService.loginCustomer(login);
        assertNotNull(logResponse.getToken());
        assertEquals("ROLE_CUSTOMER", logResponse.getRole());
    }

    @Test
    @DisplayName("Customer cannot log in via Admin portal endpoint")
    void testCustomerBlockedFromAdminPortal() {
        RegisterRequest register = new RegisterRequest();
        register.setFullName("Sneha Rao");
        register.setEmail("sneha@example.com");
        register.setPassword("Password123!");
        register.setPhone("+91 9876543211");
        authService.registerCustomer(register);

        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setEmail("sneha@example.com");
        adminLogin.setPassword("Password123!");

        assertThrows(RuntimeException.class, () -> authService.loginAdmin(adminLogin));
    }
}
