package com.transitsync.service;

import com.transitsync.entity.SystemSetting;
import com.transitsync.entity.User;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.RoleRepository;
import com.transitsync.repository.SystemSettingRepository;
import com.transitsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SystemSettingRepository settingRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<User> getAllCustomers(Pageable pageable) {
        return userRepository.findByRoleName("ROLE_CUSTOMER", pageable);
    }

    public Page<User> getAllAdmins(Pageable pageable) {
        return userRepository.findByRoleName("ROLE_ADMIN", pageable);
    }

    @Transactional
    public User createAdmin(String email, String password, String fullName, String phone) {
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new ConflictException("User already exists with email: " + email);
        }

        var adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        User admin = User.builder()
                .email(email.trim().toLowerCase())
                .fullName(fullName.trim())
                .passwordHash(passwordEncoder.encode(password))
                .role(adminRole)
                .phone(phone)
                .status("ACTIVE")
                .build();

        return userRepository.save(admin);
    }

    @Transactional
    public User updateCustomer(Long customerId, String fullName, String phone, String email) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        if (email != null && !email.trim().equalsIgnoreCase(user.getEmail())) {
            String newEmail = email.trim().toLowerCase();
            if (userRepository.existsByEmail(newEmail)) {
                throw new ConflictException("Email is already in use by another account: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void resetCustomerPassword(Long customerId, String newPassword) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        userRepository.save(user);
    }

    @Transactional
    public void deleteCustomer(Long customerId) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            throw new BadRequestException("Cannot delete administrator account via customer management.");
        }
        user.setStatus("INACTIVE");
        userRepository.save(user);
    }

    @Transactional
    public User toggleUserStatus(Long userId, Long currentAdminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Prevent self-deactivation
        if (user.getId().equals(currentAdminId)) {
            throw new BadRequestException("You cannot deactivate your own account.");
        }

        // Prevent deactivating the last remaining active admin
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName()) && "ACTIVE".equalsIgnoreCase(user.getStatus())) {
            long activeAdminCount = userRepository.countByRoleNameAndStatus("ROLE_ADMIN", "ACTIVE");
            if (activeAdminCount <= 1) {
                throw new BadRequestException("Cannot deactivate the last active administrator.");
            }
        }

        user.setStatus("ACTIVE".equalsIgnoreCase(user.getStatus()) ? "INACTIVE" : "ACTIVE");
        return userRepository.save(user);
    }

    // --- System Settings ---
    public Map<String, String> getAllSettings() {
        Map<String, String> map = new HashMap<>();
        for (SystemSetting s : settingRepository.findAll()) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    public Map<String, String> getPublicSettings() {
        Map<String, String> map = new HashMap<>();
        settingRepository.findBySettingKey("company_name").ifPresent(s -> map.put("company_name", s.getSettingValue()));
        settingRepository.findBySettingKey("tax_rate_percent").ifPresent(s -> map.put("tax_rate_percent", s.getSettingValue()));
        settingRepository.findBySettingKey("max_seats_per_booking").ifPresent(s -> map.put("max_seats_per_booking", s.getSettingValue()));
        return map;
    }

    @Transactional
    public void updateSetting(String key, String value) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        settingRepository.save(setting);
    }
}
