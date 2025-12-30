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
 * Budget data for export (includes items)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetExportDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    // Budget fields
    private Long id;
    private String name;
    private String periodType;
    private Date startDate;
    private Date endDate;
    private BigDecimal totalLimit;
    private String notes;

    // Budget items (for CSV, will be flattened)
    private List<BudgetItemExportDTO> items;

    // Metadata
    private Date createdAt;
}