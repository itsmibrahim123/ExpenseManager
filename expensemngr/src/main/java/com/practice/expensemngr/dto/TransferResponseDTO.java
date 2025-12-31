package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Response object for transfer operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long transferOutTransactionId;
    private Long transferInTransactionId;

    private Long sourceAccountId;
    private String sourceAccountName;
    private BigDecimal sourceBalanceBefore;
    private BigDecimal sourceBalanceAfter;

    private Long destinationAccountId;
    private String destinationAccountName;
    private BigDecimal destinationBalanceBefore;
    private BigDecimal destinationBalanceAfter;

    private BigDecimal amount;
    private String currencyCode;
    private Date transferDate;
    private String description;
    private String message;
}