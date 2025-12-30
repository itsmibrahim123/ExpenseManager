package io.saadmughal.assignment05.dto;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class UsersDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private String fullName;

    private String email;

    private String passwordHash;

    private String status;

    private String preferredCurrency;

    private Date createdAt;

    private Date updatedAt;

}
