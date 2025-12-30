package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * DTO for top N categories by spending/income
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCategoryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String type; // EXPENSE or INCOME
    private List<CategoryBreakdownItemDTO> topCategories;
    private Integer limit; // Number of categories returned
    private BigDecimal totalAmount;

    // Period information
    private Date startDate;
    private Date endDate;
}