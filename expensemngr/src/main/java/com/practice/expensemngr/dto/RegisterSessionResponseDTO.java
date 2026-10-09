package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterSessionResponseDTO {
    private Long id;
    private Long userId;
    private Date openedAt;
    private Date closedAt;
    private BigDecimal openingCashBalance;
    private BigDecimal expectedCashBalance;
    private BigDecimal actualCashBalance;
    private BigDecimal cashDifference;
    private String status;
    private String notes;
}
