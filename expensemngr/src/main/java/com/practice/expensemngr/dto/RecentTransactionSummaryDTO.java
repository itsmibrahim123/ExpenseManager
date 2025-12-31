package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Lightweight DTO for recent transactions in dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentTransactionSummaryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long transactionId;
    private String type;
    private BigDecimal amount;
    private String currencyCode;
    private String description;
    private String categoryName;
    private String accountName;
    private Date transactionDate;
    private String status;
}