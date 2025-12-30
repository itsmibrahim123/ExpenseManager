package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Data
public class BudgetsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private String periodType;

    private Date startDate;

    private Date endDate;

    private BigDecimal totalLimit;

    private String notes;

    private java.util.Date createdAt;

    private java.util.Date updatedAt;

}
