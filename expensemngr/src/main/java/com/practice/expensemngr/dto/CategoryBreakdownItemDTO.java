package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * DTO for individual category in breakdown
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryBreakdownItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long categoryId;
    private String categoryName;
    private BigDecimal amount;
    private Double percentage;
    private Integer transactionCount;
    private String color; // Optional category color for charts
}