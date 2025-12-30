package io.saadmughal.assignment05.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Request object for updating a recurring rule
 */
@Data
public class RecurringRuleUpdateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String description;

    @Min(value = 1, message = "Interval must be at least 1")
    private Integer intervalVal;

    @Min(value = 1, message = "Day of month must be between 1 and 31")
    @Max(value = 31, message = "Day of month must be between 1 and 31")
    private Integer dayOfMonth;

    @Pattern(regexp = "^(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)?$",
            message = "Day of week must be SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, or SATURDAY")
    private String dayOfWeek;

    private Date endDate; // Can update end date

    // Note: Cannot change userId, accountId, categoryId, type, frequency, or startDate after creation
}