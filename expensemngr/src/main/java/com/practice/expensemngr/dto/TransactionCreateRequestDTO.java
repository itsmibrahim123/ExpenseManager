package io.saadmughal.assignment05.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Time;
import java.util.Date;

/**
 * Request object for creating a new transaction
 */
@Data
public class TransactionCreateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Account ID is required")
    private Long accountId;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "^(EXPENSE|INCOME)$", message = "Type must be EXPENSE or INCOME")
    private String type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Currency code is required")
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    private String currencyCode;

    @NotNull(message = "Transaction date is required")
    private Date transactionDate;

    private Time transactionTime; // Optional

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(CLEARED|PENDING)$", message = "Status must be CLEARED or PENDING")
    private String status;

    private Long paymentMethodId; // Optional
    private Long merchantId; // Optional
    private String description; // Optional
    private String referenceNumber; // Optional
}