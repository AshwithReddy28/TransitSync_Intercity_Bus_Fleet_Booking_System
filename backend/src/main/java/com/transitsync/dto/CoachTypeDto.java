package com.transitsync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CoachTypeDto {
    private Long id;

    @NotBlank(message = "Coach type name is required")
    private String name;

    @NotBlank(message = "Coach type code is required")
    private String code;

    private String description;
    private int decks = 1;
    private boolean hasAc = true;
}
