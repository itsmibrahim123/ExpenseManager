package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class BudgetItemsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "budgetId can not null")
    private Long budgetId;

    @NotNull(message = "categoryId can not null")
    private Long categoryId;

    @NotNull(message = "limitAmount can not null")
    private BigDecimal limitAmount;

    private Integer warningPercent;

}
