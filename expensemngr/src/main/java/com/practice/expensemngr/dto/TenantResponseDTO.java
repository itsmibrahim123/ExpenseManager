package com.practice.expensemngr.dto;

import com.practice.expensemngr.entity.PlanTier;
import com.practice.expensemngr.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponseDTO {
    private UUID id;
    private String storeName;
    private String slug;
    private String contactEmail;
    private String contactPhone;
    private String currencyCode;
    private TenantStatus status;
    private PlanTier planTier;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Settings Summary
    private String taxNumber;
    private BigDecimal taxRateDefault;
    private String receiptHeader;
    private String receiptFooter;
    private String logoUrl;
    private Boolean allowNegativeStock;

    // Owner Summary
    private Long ownerUserId;
    private String ownerName;
}
