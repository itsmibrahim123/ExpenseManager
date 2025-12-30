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
 * Response object for budget with all its items
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetWithItemsResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private String name;
    private String periodType;
    private Date startDate;
    private Date endDate;
    private BigDecimal totalLimit;
    private String notes;
    private String status; // UPCOMING, ACTIVE, EXPIRED
    private Date createdAt;
    private Date updatedAt;

    private List<BudgetItemDTO> items; // All budget items
    private Integer itemCount; // Number of items
}