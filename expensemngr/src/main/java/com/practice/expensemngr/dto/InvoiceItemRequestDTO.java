package com.practice.expensemngr.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InvoiceItemRequestDTO {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private BigDecimal unitPrice; // Optional override; defaults to product selling price

    private BigDecimal taxRate = BigDecimal.ZERO; // e.g. 5.0 for 5%

    private BigDecimal discountAmount = BigDecimal.ZERO;
}
