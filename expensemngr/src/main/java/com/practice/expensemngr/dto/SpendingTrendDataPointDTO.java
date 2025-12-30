package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * DTO for single data point in spending trend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTrendDataPointDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String period; // e.g., "2025-12-01", "Week 48", "December 2025"
    private BigDecimal income;
    private BigDecimal expense;
    private BigDecimal net;
    private Integer transactionCount;
}