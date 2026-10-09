package com.practice.expensemngr.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tenant_settings", indexes = {
    @Index(name = "idx_tenant_settings_tenant_id", columnList = "tenant_id", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSettings implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "tax_number")
    private String taxNumber;

    @Column(name = "tax_rate_default")
    private BigDecimal taxRateDefault;

    @Column(name = "receipt_header", columnDefinition = "TEXT")
    private String receiptHeader;

    @Column(name = "receipt_footer", columnDefinition = "TEXT")
    private String receiptFooter;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "allow_negative_stock", nullable = false)
    private Boolean allowNegativeStock;

    @PrePersist
    protected void onCreate() {
        if (this.allowNegativeStock == null) {
            this.allowNegativeStock = false;
        }
        if (this.taxRateDefault == null) {
            this.taxRateDefault = BigDecimal.ZERO;
        }
    }
}
