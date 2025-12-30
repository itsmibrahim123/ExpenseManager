package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * DTO for income vs expense comparison
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeExpenseComparisonDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netSavings;
    private Double savingsRate; // (income - expense) / income * 100

    private Integer incomeTransactionCount;
    private Integer expenseTransactionCount;

    private BigDecimal averageIncome; // per transaction
    private BigDecimal averageExpense; // per transaction

    // Period information
    private Date startDate;
    private Date endDate;
    private String periodDescription;
}