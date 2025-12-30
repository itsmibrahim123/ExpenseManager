package io.saadmughal.assignment05.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * Request object for creating a new budget
 */
@Data
public class BudgetCreateRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Budget name is required")
    @Size(min = 2, max = 100, message = "Budget name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Period type is required")
    @Pattern(regexp = "^(MONTHLY|WEEKLY|YEARLY|CUSTOM)$", message = "Period type must be MONTHLY, WEEKLY, YEARLY, or CUSTOM")
    private String periodType;

    @NotNull(message = "Start date is required")
    private Date startDate;

    private Date endDate; // Required for CUSTOM, auto-calculated for others

    private BigDecimal totalLimit; // Optional overall budget limit

    private String notes; // Optional notes

    @Valid
    private List<BudgetItemDTO> items; // Budget items (category-wise limits)
}