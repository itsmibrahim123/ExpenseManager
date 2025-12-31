package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class CategoriesVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    private Long userId;

    private Long parentCategoryId;

    @NotNull(message = "name can not null")
    private String name;

    @NotNull(message = "type can not null")
    private String type;

    private String icon;

    private String color;

    private Integer sortOrder;

    @NotNull(message = "archived can not null")
    private Boolean archived;

    @NotNull(message = "createdAt can not null")
    private Date createdAt;

    @NotNull(message = "updatedAt can not null")
    private Date updatedAt;

}
