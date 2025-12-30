package io.saadmughal.assignment05.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Request object for creating a recurring rule
 */
@Data
public class RecurringRuleCreateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Account ID is required")
    private Long accountId;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Long paymentMethodId; // Optional

    private Long merchantId; // Optional

    @NotBlank(message = "Transaction type is required")
    @Pattern(regexp = "^(EXPENSE|INCOME|TRANSFER)$", message = "Type must be EXPENSE, INCOME, or TRANSFER")
    private String type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Currency code is required")
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    private String currencyCode;

    private String description;

    @NotBlank(message = "Frequency is required")
    @Pattern(regexp = "^(DAILY|WEEKLY|MONTHLY|YEARLY)$", message = "Frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY")
    private String frequency;

    @NotNull(message = "Interval is required")
    @Min(value = 1, message = "Interval must be at least 1")
    private Integer intervalVal;

    @Min(value = 1, message = "Day of month must be between 1 and 31")
    @Max(value = 31, message = "Day of month must be between 1 and 31")
    private Integer dayOfMonth; // Required for MONTHLY

    @Pattern(regexp = "^(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)?$",
            message = "Day of week must be SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, or SATURDAY")
    private String dayOfWeek; // Required for WEEKLY

    @NotNull(message = "Start date is required")
    private Date startDate;

    private Date endDate; // Optional - null means indefinite
}