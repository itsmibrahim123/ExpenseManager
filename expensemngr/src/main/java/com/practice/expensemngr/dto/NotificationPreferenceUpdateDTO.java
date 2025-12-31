package com.practice.expensemngr.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Request object for updating notification preference
 */
@Data
public class NotificationPreferenceUpdateDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Boolean enabled;

    @DecimalMin(value = "0.0", inclusive = true, message = "Threshold amount must be greater than or equal to 0")
    private BigDecimal thresholdAmount;
}