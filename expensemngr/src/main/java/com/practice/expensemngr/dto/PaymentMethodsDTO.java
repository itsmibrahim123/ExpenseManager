package io.saadmughal.assignment05.dto;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class PaymentMethodsDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private String type;

    private String last4;

    private Boolean archived;

    private Date createdAt;

    private Date updatedAt;

}
