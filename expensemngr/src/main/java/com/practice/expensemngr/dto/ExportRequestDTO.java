package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * Request object for data export
 */
@Data
public class ExportRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "User ID is required")
    private Long userId;

    // DataType is set by controller, not required in request
    private String dataType;

    @NotNull(message = "Export format is required")
    @Pattern(regexp = "CSV|JSON|EXCEL|PDF",
            message = "Format must be CSV, JSON, EXCEL, or PDF")
    private String format;

    // Date range filters (for transactions)
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date startDate;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date endDate;

    // Additional filters
    private Long accountId;
    private Long categoryId;
    private String type; // EXPENSE, INCOME, TRANSFER
    private String status; // CLEARED, PENDING
}