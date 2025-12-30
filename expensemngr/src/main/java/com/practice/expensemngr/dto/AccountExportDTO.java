package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * Account data for export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountExportDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String type;
    private BigDecimal currentBalance;
    private BigDecimal initialBalance;
    private String currencyCode;
    private Boolean archived;
    private Date createdAt;
    private Date updatedAt;
}