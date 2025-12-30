package com.practice.expensemngr.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Request object for creating a new account
 */
@Data
public class AccountCreateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Account name is required")
    @Size(min = 2, max = 100, message = "Account name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Account type is required")
    private String type; // Cash, Bank, Credit Card, Mobile Wallet, Other

    @NotBlank(message = "Currency code is required")
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters (e.g., USD, PKR)")
    private String currencyCode;

    @NotNull(message = "Initial balance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Initial balance cannot be negative")
    private BigDecimal initialBalance;
}