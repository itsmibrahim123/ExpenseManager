package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockAdjustmentDTO {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChanged; // Positive for addition, negative for deduction

    @NotBlank(message = "Movement type is required")
    private String movementType; // SALE_DEDUCT, PURCHASE_RESTOCK, RETURN, ADJUSTMENT_DAMAGE

    private String notes;

    private String referenceId;
}
