package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class BudgetsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "name can not null")
    private String name;

    @NotNull(message = "periodType can not null")
    private String periodType;

    @NotNull(message = "startDate can not null")
    private Date startDate;

    @NotNull(message = "endDate can not null")
    private Date endDate;

    private BigDecimal totalLimit;

    private String notes;

    @NotNull(message = "createdAt can not null")
    private java.util.Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private java.util.Date updatedAt;

}
