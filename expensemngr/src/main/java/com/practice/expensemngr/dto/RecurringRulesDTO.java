package com.practice.expensemngr.dto;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class RecurringRulesDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private Long accountId;

    private Long categoryId;

    private Long paymentMethodId;

    private Long merchantId;

    private String type;

    private BigDecimal amount;

    private String currencyCode;

    private String description;

    private String frequency;

    private Integer intervalVal;

    private Integer dayOfMonth;

    private String dayOfWeek;

    private Date startDate;

    private Date endDate;

    private Date nextRunDate;

    private Boolean active;

    private java.util.Date createdAt;

    private java.util.Date updatedAt;

}
