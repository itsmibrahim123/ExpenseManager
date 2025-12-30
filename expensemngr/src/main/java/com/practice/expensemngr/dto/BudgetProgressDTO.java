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
 * DTO for overall budget progress
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetProgressDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long budgetId;
    private String budgetName;
    private Date budgetStartDate;
    private Date budgetEndDate;
    private BigDecimal totalBudgeted;
    private BigDecimal totalActual;
    private BigDecimal totalRemaining;
    private Double overallPercentage;
    private String overallStatus; // ON_TRACK, WARNING, OVER_BUDGET

    private List<BudgetItemProgressDTO> items;

    // Period information
    private Date reportStartDate;
    private Date reportEndDate;
}