package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * DTO for transaction filter criteria
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionFilterDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long userId;
    private Date startDate;
    private Date endDate;
    private Long accountId;
    private Long categoryId;
    private String type; // EXPENSE, INCOME, TRANSFER
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String keyword; // Search in description and reference
    private Long tagId;
    private String status; // CLEARED, PENDING
    private Integer page;
    private Integer size;
}