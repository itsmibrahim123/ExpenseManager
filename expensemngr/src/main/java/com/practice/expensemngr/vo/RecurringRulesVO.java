package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class RecurringRulesVO implements Serializable {
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

    @NotNull(message = "type can not null")
    private String type;

    @NotNull(message = "amount can not null")
    private BigDecimal amount;

    @NotNull(message = "currencyCode can not null")
    private String currencyCode;

    private String description;

    @NotNull(message = "frequency can not null")
    private String frequency;

    @NotNull(message = "intervalVal can not null")
    private Integer intervalVal;

    private Integer dayOfMonth;

    private String dayOfWeek;

    @NotNull(message = "startDate can not null")
    private Date startDate;

    private Date endDate;

    @NotNull(message = "nextRunDate can not null")
    private Date nextRunDate;

    @NotNull(message = "active can not null")
    private Boolean active;

    @NotNull(message = "createdAt can not null")
    private java.util.Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private java.util.Date updatedAt;

}
