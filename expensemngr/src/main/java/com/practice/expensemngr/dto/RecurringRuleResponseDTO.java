package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Response object for recurring rule details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringRuleResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private Long accountId;
    private String accountName; // For display
    private Long categoryId;
    private String categoryName; // For display
    private Long paymentMethodId;
    private String paymentMethodName; // For display
    private Long merchantId;
    private String merchantName; // For display
    private String type;
    private BigDecimal amount;
    private String currencyCode;
    private String description;
    private String frequency;
    private Integer intervalVal;
    private Integer dayOfMonth;
    private String dayOfWeek;
    private Date startDate;
    private Date endDate;
    private Date nextRunDate;
    private Boolean active;
    private Date createdAt;
    private Date updatedAt;

    // Additional computed fields for display
    private String frequencyDescription; // e.g., "Every 2 weeks on Monday"
    private String statusDescription; // e.g., "Active", "Inactive", "Expired"
}