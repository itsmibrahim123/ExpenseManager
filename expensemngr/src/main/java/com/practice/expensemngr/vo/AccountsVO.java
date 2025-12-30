package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class AccountsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "name can not null")
    private String name;

    @NotNull(message = "type can not null")
    private String type;

    @NotNull(message = "currencyCode can not null")
    private String currencyCode;

    @NotNull(message = "initialBalance can not null")
    private BigDecimal initialBalance;

    @NotNull(message = "currentBalance can not null")
    private BigDecimal currentBalance;

    @NotNull(message = "archived can not null")
    private Boolean archived;

    @NotNull(message = "createdAt can not null")
    private Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private Date updatedAt;

}
