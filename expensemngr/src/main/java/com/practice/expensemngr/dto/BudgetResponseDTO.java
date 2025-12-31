package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Response object for budget details (without items)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponseDTO implements Serializable {
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
}