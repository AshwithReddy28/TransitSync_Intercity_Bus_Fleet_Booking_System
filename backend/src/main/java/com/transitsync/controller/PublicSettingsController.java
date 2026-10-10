package com.transitsync.controller;

import com.transitsync.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Public application configuration")
public class PublicSettingsController {

    private final AdminManagementService adminManagementService;

    @GetMapping("/public")
    @Operation(summary = "Get public system settings (company name, tax percentage, max booking seats)")
    public ResponseEntity<Map<String, String>> getPublicSettings() {
        return ResponseEntity.ok(adminManagementService.getPublicSettings());
    }
}
