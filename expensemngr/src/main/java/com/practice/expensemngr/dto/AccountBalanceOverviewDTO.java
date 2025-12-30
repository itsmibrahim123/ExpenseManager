package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for account balance overview
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountBalanceOverviewDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<AccountSummaryDTO> accounts;
    private BigDecimal totalBalance;
    private Integer totalAccounts;
    private Integer activeAccounts;
    private Integer archivedAccounts;

    // Breakdown by account type
    private BigDecimal cashTotal;
    private BigDecimal bankTotal;
    private BigDecimal creditCardTotal;
    private BigDecimal mobileWalletTotal;
    private BigDecimal otherTotal;
}