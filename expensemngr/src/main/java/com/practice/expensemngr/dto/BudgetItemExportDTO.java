package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Budget item data for export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemExportDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String categoryName;
    private BigDecimal limitAmount;
    private Integer warningPercent;
}