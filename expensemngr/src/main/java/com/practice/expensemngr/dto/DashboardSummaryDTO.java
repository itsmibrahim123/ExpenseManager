package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * DTO for overall dashboard summary
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Account summaries
    private List<AccountSummaryDTO> accounts;
    private BigDecimal totalBalance;
    private Integer accountCount;

    // Transaction summaries for period
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netSavings;
    private Integer transactionCount;

    // Recent transactions
    private List<RecentTransactionSummaryDTO> recentTransactions;

    // Period information
    private Date startDate;
    private Date endDate;
    private String periodDescription; // e.g., "December 2025"
}