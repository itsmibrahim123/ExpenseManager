package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Request object for updating an existing budget
 */
@Data
public class BudgetUpdateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Budget name is required")
    @Size(min = 2, max = 100, message = "Budget name must be between 2 and 100 characters")
    private String name;

    private Date startDate; // Can update start date
    private Date endDate; // Can update end date
    private BigDecimal totalLimit; // Can update total limit
    private String notes; // Can update notes
}