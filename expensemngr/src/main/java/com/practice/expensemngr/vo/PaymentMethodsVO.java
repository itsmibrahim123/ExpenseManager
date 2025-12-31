package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class PaymentMethodsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "name can not null")
    private String name;

    @NotNull(message = "type can not null")
    private String type;

    private String last4;

    @NotNull(message = "archived can not null")
    private Boolean archived;

    @NotNull(message = "createdAt can not null")
    private Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private Date updatedAt;

}
