package com.practice.expensemngr.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class DashboardDTO {
    private BigDecimal totalBalance;
    private BigDecimal incomeThisMonth;
    private BigDecimal expenseThisMonth;

    // Example: {"Food": 500.0, "Transport": 100.0}
    private Map<String, BigDecimal> expenseByCategory;
}