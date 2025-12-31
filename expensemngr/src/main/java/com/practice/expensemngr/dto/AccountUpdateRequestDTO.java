package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Request object for updating an existing account
 */
@Data
public class AccountUpdateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Account name is required")
    @Size(min = 2, max = 100, message = "Account name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Account type is required")
    private String type; // Cash, Bank, Credit Card, Mobile Wallet, Other

    // Note: Currency cannot be changed if account has transactions
    private String currencyCode;
}