package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsDTO {
    private long totalTenants;
    private long activeTenants;
    private long trialTenants;
    private long suspendedTenants;
    private long cancelledTenants;
    private long newStoresLast7Days;
    private BigDecimal totalSalesVolume30Days;
}
