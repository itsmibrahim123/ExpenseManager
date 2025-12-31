package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * DTO for spending trends over time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTrendDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String groupBy; // DAILY, WEEKLY, MONTHLY
    private List<SpendingTrendDataPointDTO> dataPoints;

    // Period information
    private Date startDate;
    private Date endDate;
}