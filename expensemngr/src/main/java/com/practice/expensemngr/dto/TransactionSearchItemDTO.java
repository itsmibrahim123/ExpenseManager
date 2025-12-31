package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * DTO for individual transaction in search results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionSearchItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String type;
    private BigDecimal amount;
    private String currencyCode;
    private String description;
    private String referenceNumber;
    private Date transactionDate;
    private String status;

    // Related entity names
    private Long accountId;
    private String accountName;
    private Long categoryId;
    private String categoryName;

    // Tags
    private List<TagDTO> tags;

    // Additional info
    private Date createdAt;
}