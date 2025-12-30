package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class BudgetItemsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long budgetId;

    private Long categoryId;

    private BigDecimal limitAmount;

    private Integer warningPercent;

}
