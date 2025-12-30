package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * DTO for individual budget item progress
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemProgressDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long budgetItemId;
    private Long categoryId;
    private String categoryName;
    private BigDecimal budgeted;
    private BigDecimal actual;
    private BigDecimal remaining;
    private Double percentage;
    private String status; // ON_TRACK, WARNING, OVER_BUDGET
    private Integer warningPercent;
}