package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OpenRegisterDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Opening cash float balance is required")
    @PositiveOrZero(message = "Opening cash balance must be zero or positive")
    private BigDecimal openingCashBalance;

    private String notes;
}
