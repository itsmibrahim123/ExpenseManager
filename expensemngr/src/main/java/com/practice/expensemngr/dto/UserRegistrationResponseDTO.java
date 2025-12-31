package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * Response object returned after successful user registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long userId;
    private String fullName;
    private String email;
    private String status;
    private String preferredCurrency;
    private Date createdAt;
    private String message;
}