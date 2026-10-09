package com.practice.expensemngr.dto;

import com.practice.expensemngr.entity.TenantSettings;
import com.practice.expensemngr.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long userId;
    private String fullName;
    private String email;
    private UserRole role;
    private UUID tenantId;
    private String storeName;
    private TenantSettings tenantSettings;

    public AuthResponse(String token) {
        this.token = token;
        this.type = "Bearer";
    }
}