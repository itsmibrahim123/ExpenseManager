package com.practice.expensemngr.entity;

import com.practice.expensemngr.config.TenantContext;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseTenantEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    public void autoAssignTenant() {
        if (this.tenantId == null) {
            UUID current = TenantContext.getCurrentTenant();
            if (current != null) {
                this.tenantId = current;
            }
        }
    }
}
