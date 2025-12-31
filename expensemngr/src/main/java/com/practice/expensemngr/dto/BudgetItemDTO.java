package com.practice.expensemngr.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * DTO for budget item (category-wise limit)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id; // Present in response, absent in request

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Limit amount is required")
    @DecimalMin(value = "0.01", message = "Limit amount must be greater than zero")
    private BigDecimal limitAmount;

    @Min(value = 1, message = "Warning percent must be between 1 and 100")
    @Max(value = 100, message = "Warning percent must be between 1 and 100")
    private Integer warningPercent; // Optional, default 80%

    // For response - include category name
    private String categoryName;
}