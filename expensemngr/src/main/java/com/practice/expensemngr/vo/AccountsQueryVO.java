package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class AccountsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private String type;

    private String currencyCode;

    private BigDecimal initialBalance;

    private BigDecimal currentBalance;

    private Boolean archived;

    private Date createdAt;

    private Date updatedAt;

}
