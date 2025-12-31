package com.practice.expensemngr.vo;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class TagsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String name;

    private String color;

    private Date createdAt;

}
