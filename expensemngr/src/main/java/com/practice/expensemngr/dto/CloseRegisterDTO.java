package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CloseRegisterDTO {

    @NotNull(message = "Actual counted cash balance is required")
    @PositiveOrZero(message = "Actual cash balance must be zero or positive")
    private BigDecimal actualCashBalance;

    private String notes;
}
