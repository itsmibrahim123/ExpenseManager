package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;

@Data
public class TransactionsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "accountId can not null")
    private Long accountId;

    @NotNull(message = "categoryId can not null")
    private Long categoryId;

    private Long paymentMethodId;

    private Long merchantId;

    private Long recurringRuleId;

    @NotNull(message = "type can not null")
    private String type;

    @NotNull(message = "amount can not null")
    private BigDecimal amount;

    @NotNull(message = "currencyCode can not null")
    private String currencyCode;

    private BigDecimal exchangeRateToBase;

    private BigDecimal baseAmount;

    @NotNull(message = "transactionDate can not null")
    private Date transactionDate;

    private Time transactionTime;

    @NotNull(message = "status can not null")
    private String status;

    private String referenceNumber;

    private String description;

    @NotNull(message = "recurringInstance can not null")
    private Boolean recurringInstance;

    private Long linkedTransactionId;

    @NotNull(message = "createdAt can not null")
    private java.util.Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private java.util.Date updatedAt;

}
