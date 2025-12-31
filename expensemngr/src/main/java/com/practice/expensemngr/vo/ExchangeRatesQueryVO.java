package com.practice.expensemngr.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class ExchangeRatesQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private String fromCode;

    private String toCode;

    private BigDecimal rate;

    private Date rateDate;

    private java.util.Date createdAt;

}
