package com.practice.expensemngr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class InvoiceCreateRequestDTO {

    private Long customerId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long accountId; // Target bank/cash account for ledger credit

    private Long categoryId; // Category for income transaction

    @NotEmpty(message = "Invoice must contain at least one line item")
    @Valid
    private List<InvoiceItemRequestDTO> items;

    private BigDecimal discountTotal = BigDecimal.ZERO;

    private BigDecimal paidAmount; // If empty, defaults to grandTotal

    @NotNull(message = "Payment method is required")
    private String paymentMethod = "CASH"; // CASH, CARD, TRANSFER, CUSTOMER_CREDIT
}
