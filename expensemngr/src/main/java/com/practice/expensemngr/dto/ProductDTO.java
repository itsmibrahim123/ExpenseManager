package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String sku;
    private String barcode;
    private String name;
    private String description;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private Integer currentStock;
    private Integer reorderLevel;
    private String unit;
    private Long categoryId;
    private String categoryName;
    private Boolean active;
    private Boolean isLowStock;
    private Date createdAt;
    private Date updatedAt;
}
