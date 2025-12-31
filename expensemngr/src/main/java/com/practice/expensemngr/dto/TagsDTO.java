package com.practice.expensemngr.dto;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class TagsDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private String color;

    private Date createdAt;

}
