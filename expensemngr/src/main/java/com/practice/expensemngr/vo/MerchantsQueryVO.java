package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class MerchantsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private Long categoryId;

    private String address;

    private String phone;

    private String website;

    private Date createdAt;

    private Date updatedAt;

}
