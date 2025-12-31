package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * DTO for category-wise spending/income breakdown
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryBreakdownDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String type; // EXPENSE or INCOME
    private List<CategoryBreakdownItemDTO> categories;
    private BigDecimal totalAmount;
    private Integer totalTransactionCount;

    // Period information
    private Date startDate;
    private Date endDate;
}