package com.practice.expensemngr.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRestockRequestDTO {

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Restock quantity must be at least 1")
    private Integer quantity;

    private BigDecimal unitCostPrice; // Optional override for purchase cost

    @NotNull(message = "Account ID is required to log purchase expense")
    private Long accountId;

    private Long categoryId; // Optional expense category

    private String notes;

    private String referenceId; // Supplier invoice or Purchase Order number
}
