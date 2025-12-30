package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * Category data for export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExportDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String type;
    private String icon;
    private String color;
    private Integer sortOrder;
    private Boolean archived;
    private String parentCategoryName; // Parent category if applicable
    private Date createdAt;
    private Date updatedAt;
}