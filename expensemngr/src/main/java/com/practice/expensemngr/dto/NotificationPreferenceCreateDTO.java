package com.practice.expensemngr.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Request object for creating notification preference
 */
@Data
public class NotificationPreferenceCreateDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Notification type is required")
    @Pattern(regexp = "BUDGET_THRESHOLD|LARGE_EXPENSE|RECURRING_FAILURE",
            message = "Type must be BUDGET_THRESHOLD, LARGE_EXPENSE, or RECURRING_FAILURE")
    private String type;

    @NotBlank(message = "Notification channel is required")
    @Pattern(regexp = "EMAIL|PUSH|SMS|IN_APP",
            message = "Channel must be EMAIL, PUSH, SMS, or IN_APP")
    private String channel;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;

    @DecimalMin(value = "0.0", inclusive = true, message = "Threshold amount must be greater than or equal to 0")
    private BigDecimal thresholdAmount; // Optional, used for LARGE_EXPENSE
}