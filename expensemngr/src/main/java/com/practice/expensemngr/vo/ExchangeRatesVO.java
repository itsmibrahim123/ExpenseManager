package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class ExchangeRatesVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "fromCode can not null")
    private String fromCode;

    @NotNull(message = "toCode can not null")
    private String toCode;

    @NotNull(message = "rate can not null")
    private BigDecimal rate;

    @NotNull(message = "rateDate can not null")
    private Date rateDate;

    @NotNull(message = "createdAt can not null")
    private java.util.Date createdAt;

}
