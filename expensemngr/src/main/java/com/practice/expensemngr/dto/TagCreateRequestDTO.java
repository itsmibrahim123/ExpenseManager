package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Request object for creating a new tag
 */
@Data
public class TagCreateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Tag name is required")
    @Size(min = 1, max = 50, message = "Tag name must be between 1 and 50 characters")
    private String name;

    @Size(max = 7, message = "Color must be a valid hex code (e.g., #FF5733)")
    private String color; // Optional, e.g., "#FF5733"
}