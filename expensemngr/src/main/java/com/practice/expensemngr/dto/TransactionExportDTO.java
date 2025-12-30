package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Flattened transaction data for export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionExportDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Transaction fields
    private Long id;
    private Date transactionDate;
    private String type;
    private BigDecimal amount;
    private String currencyCode;
    private String description;
    private String referenceNumber;
    private String status;

    // Related entity names (denormalized for export)
    private String accountName;
    private String categoryName;
    private String paymentMethodName;
    private String merchantName;

    // Tags (comma-separated)
    private String tags;

    // Metadata
    private Date createdAt;
}