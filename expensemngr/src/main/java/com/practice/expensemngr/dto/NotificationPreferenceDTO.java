package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * DTO for notification preference information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private String type; // BUDGET_THRESHOLD, LARGE_EXPENSE, RECURRING_FAILURE
    private String channel; // EMAIL, PUSH, SMS, IN_APP
    private Boolean enabled;
    private BigDecimal thresholdAmount; // Optional, used for LARGE_EXPENSE
    private Date createdAt;
    private Date updatedAt;

    // Display fields
    private String typeDisplayName;
    private String typeDescription;
    private String channelDisplayName;
}