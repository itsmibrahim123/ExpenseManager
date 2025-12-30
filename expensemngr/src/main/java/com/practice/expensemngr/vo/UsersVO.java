package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class UsersVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "fullName can not null")
    private String fullName;

    @NotNull(message = "email can not null")
    private String email;

    @NotNull(message = "passwordHash can not null")
    private String passwordHash;

    @NotNull(message = "status can not null")
    private String status;

    private String preferredCurrency;

    @NotNull(message = "createdAt can not null")
    private Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private Date updatedAt;

}
