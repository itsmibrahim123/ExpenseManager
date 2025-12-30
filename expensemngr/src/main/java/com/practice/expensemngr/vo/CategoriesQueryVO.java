package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class CategoriesQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private Long parentCategoryId;

    private String name;

    private String type;

    private String icon;

    private String color;

    private Integer sortOrder;

    private Boolean archived;

    private Date createdAt;

    private Date updatedAt;

}
