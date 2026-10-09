package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryDTO {
    private Date date;
    private Long sessionId;
    private String sessionStatus;
    private Date sessionOpenedAt;
    private Date sessionClosedAt;
    private BigDecimal openingCashFloat;
    
    // Revenue Breakdown by Channel
    private BigDecimal totalSales;
    private BigDecimal cashSales;
    private BigDecimal cardSales;
    private BigDecimal transferSales;
    private BigDecimal creditSales;
    private Map<String, BigDecimal> salesByPaymentMethod;
    private long totalInvoicesCount;
    
    // Expenses Incurred
    private BigDecimal totalExpenses;
    private BigDecimal cashExpenses;
    
    // Drawer Cash Reconciliation
    private BigDecimal netCashInflow; // cashSales - cashExpenses
    private BigDecimal expectedCashInDrawer; // openingCashFloat + cashSales - cashExpenses
    private BigDecimal actualCashInDrawer;
    private BigDecimal cashVariance; // actual - expected
}
