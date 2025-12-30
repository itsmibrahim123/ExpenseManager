package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * DTO for individual account summary
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountSummaryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long accountId;
    private String accountName;
    private String accountType;
    private BigDecimal currentBalance;
    private String currencyCode;
    private Boolean archived;
}