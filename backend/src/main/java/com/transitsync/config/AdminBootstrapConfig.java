package com.transitsync.config;

import com.transitsync.entity.Role;
import com.transitsync.entity.User;
import com.transitsync.repository.RoleRepository;
import com.transitsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${admin.bootstrap.email:admin@transitsync.com}")
    private String adminEmail;

    @Value("${admin.bootstrap.password:Admin@Transit2026!}")
    private String adminPassword;

    @Value("${admin.bootstrap.name:Super Administrator}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));

        roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").build()));

        if (!userRepository.existsByEmail(adminEmail.trim().toLowerCase())) {
            User admin = User.builder()
                    .email(adminEmail.trim().toLowerCase())
                    .fullName(adminName)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(adminRole)
                    .status("ACTIVE")
                    .phone("1800-TRANSIT")
                    .build();
            userRepository.save(admin);
            log.info("Initial bootstrap Administrator created successfully: {}", adminEmail);
        }
    }
}
