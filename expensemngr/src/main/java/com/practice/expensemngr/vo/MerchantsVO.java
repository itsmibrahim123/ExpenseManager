package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class MerchantsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "name can not null")
    private String name;

    private Long categoryId;

    private String address;

    private String phone;

    private String website;

    @NotNull(message = "createdAt can not null")
    private Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private Date updatedAt;

}
