package com.practice.expensemngr.dto;

import com.practice.expensemngr.entity.TenantStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTenantStatusDTO {
    @NotNull(message = "Status is required")
    private TenantStatus status;
}
