package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.entity.PlanTier;
import com.practice.expensemngr.entity.TenantSettings;
import com.practice.expensemngr.entity.TenantStatus;
import com.practice.expensemngr.service.TenantProvisioningService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/admin")
public class SuperAdminController {

    @Autowired
    private TenantProvisioningService tenantProvisioningService;

    @PostMapping("/tenants")
    public ResponseEntity<TenantResponseDTO> createTenant(@Valid @RequestBody TenantOnboardingRequestDTO request) {
        TenantResponseDTO response = tenantProvisioningService.provisionTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tenants")
    public ResponseEntity<Page<TenantResponseDTO>> getTenants(
            @RequestParam(required = false) TenantStatus status,
            @RequestParam(required = false) PlanTier planTier,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TenantResponseDTO> tenants = tenantProvisioningService.getTenants(status, planTier, query, page, size);
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<TenantResponseDTO> getTenantById(@PathVariable UUID id) {
        TenantResponseDTO tenant = tenantProvisioningService.getTenantById(id);
        return ResponseEntity.ok(tenant);
    }

    @PutMapping("/tenants/{id}/status")
    public ResponseEntity<TenantResponseDTO> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantStatusDTO request) {
        TenantResponseDTO tenant = tenantProvisioningService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(tenant);
    }

    @PutMapping("/tenants/{id}/subscription")
    public ResponseEntity<TenantResponseDTO> updateSubscription(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubscriptionDTO request) {
        TenantResponseDTO tenant = tenantProvisioningService.updateSubscription(id, request);
        return ResponseEntity.ok(tenant);
    }

    @GetMapping("/metrics")
    public ResponseEntity<PlatformMetricsDTO> getPlatformMetrics() {
        PlatformMetricsDTO metrics = tenantProvisioningService.getPlatformMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/tenants/{id}/settings")
    public ResponseEntity<TenantSettings> getSettings(@PathVariable UUID id) {
        TenantSettings settings = tenantProvisioningService.getTenantSettings(id);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/tenants/{id}/settings")
    public ResponseEntity<TenantSettings> updateSettings(
            @PathVariable UUID id,
            @RequestBody TenantSettings request) {
        TenantSettings settings = tenantProvisioningService.updateTenantSettings(id, request);
        return ResponseEntity.ok(settings);
    }
}
