package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String fullName;
    private String email;
    private String status;
    private String preferredCurrency;
    private String message;
}