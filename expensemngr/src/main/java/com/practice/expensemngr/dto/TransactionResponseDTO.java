package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Time;
import java.util.Date;

/**
 * Response object for transaction details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private Long accountId;
    private Long categoryId;
    private Long paymentMethodId;
    private Long merchantId;
    private String type;
    private BigDecimal amount;
    private String currencyCode;
    private Date transactionDate;
    private Time transactionTime;
    private String status;
    private String referenceNumber;
    private String description;
    private Date createdAt;
    private Date updatedAt;

    // Additional info for display
    private String accountName;
    private String categoryName;
    private BigDecimal accountBalanceAfter;
}