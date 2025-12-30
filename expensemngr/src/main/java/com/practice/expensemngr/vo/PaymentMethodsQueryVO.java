package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class PaymentMethodsQueryVO implements Serializable {
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
