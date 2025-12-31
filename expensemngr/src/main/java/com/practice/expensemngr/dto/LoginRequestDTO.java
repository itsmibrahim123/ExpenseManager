package com.practice.expensemngr.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;

/**
 * Request object for user login
 */
@Data
public class LoginRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}