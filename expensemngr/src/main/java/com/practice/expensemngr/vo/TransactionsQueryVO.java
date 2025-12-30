package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;

@Data
public class TransactionsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private Long accountId;

    private Long categoryId;

    private Long paymentMethodId;

    private Long merchantId;

    private Long recurringRuleId;

    private String type;

    private BigDecimal amount;

    private String currencyCode;

    private BigDecimal exchangeRateToBase;

    private BigDecimal baseAmount;

    private Date transactionDate;

    private Time transactionTime;

    private String status;

    private String referenceNumber;

    private String description;

    private Boolean recurringInstance;

    private Long linkedTransactionId;

    private java.util.Date createdAt;

    private java.util.Date updatedAt;

}
