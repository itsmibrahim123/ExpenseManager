package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class TenantProvisioningService {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantSettingsRepository tenantSettingsRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public TenantResponseDTO provisionTenant(TenantOnboardingRequestDTO request) {
        if (tenantRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Store slug '" + request.getSlug() + "' is already taken.");
        }

        if (usersRepository.existsByEmail(request.getOwnerEmail())) {
            throw new IllegalArgumentException("Owner email '" + request.getOwnerEmail() + "' is already registered.");
        }

        int trialDays = request.getTrialDays() != null ? request.getTrialDays() : 14;
        Instant expiresAt = Instant.now().plus(trialDays, ChronoUnit.DAYS);

        // 1. Save Tenant
        Tenant tenant = Tenant.builder()
                .storeName(request.getStoreName())
                .slug(request.getSlug())
                .contactEmail(request.getOwnerEmail())
                .contactPhone(request.getContactPhone())
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "PKR")
                .status(TenantStatus.TRIAL)
                .planTier(request.getPlanTier() != null ? request.getPlanTier() : PlanTier.STARTER)
                .expiresAt(expiresAt)
                .build();

        tenant = tenantRepository.save(tenant);
        UUID tenantId = tenant.getId();

        // 2. Save TenantSettings
        TenantSettings settings = TenantSettings.builder()
                .tenantId(tenantId)
                .taxNumber("TAX-" + request.getSlug().toUpperCase())
                .taxRateDefault(new BigDecimal("0.0"))
                .receiptHeader(request.getStoreName() + "\nRetail & Commerce Operations")
                .receiptFooter("Thank you for shopping at " + request.getStoreName() + "!\nPlease come again.")
                .allowNegativeStock(false)
                .build();
        settings = tenantSettingsRepository.save(settings);

        // 3. Create Store Owner User
        Users owner = Users.builder()
                .tenantId(tenantId)
                .fullName(request.getOwnerName())
                .email(request.getOwnerEmail())
                .passwordHash(passwordEncoder.encode(request.getOwnerPassword()))
                .role(UserRole.ROLE_STORE_ADMIN)
                .userStatus(UserStatus.ACTIVE)
                .status("ACTIVE")
                .preferredCurrency(tenant.getCurrencyCode())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        owner = usersRepository.save(owner);

        // 4. Seed Baseline Accounts, Customers & Categories for Tenant
        Accounts cashDrawer = Accounts.builder()
                .tenantId(tenantId)
                .userId(owner.getId())
                .name("Main Cash Drawer")
                .type("CASH")
                .currencyCode(tenant.getCurrencyCode())
                .initialBalance(new BigDecimal("10000"))
                .currentBalance(new BigDecimal("10000"))
                .archived(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        accountsRepository.save(cashDrawer);

        Accounts bankAccount = Accounts.builder()
                .tenantId(tenantId)
                .userId(owner.getId())
                .name("Main Bank Account")
                .type("BANK")
                .currencyCode(tenant.getCurrencyCode())
                .initialBalance(new BigDecimal("100000"))
                .currentBalance(new BigDecimal("100000"))
                .archived(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        accountsRepository.save(bankAccount);

        Customer walkIn = Customer.builder()
                .tenantId(tenantId)
                .name("Walk-in Customer")
                .phone("000-000-0000")
                .email("walkin@" + request.getSlug() + ".com")
                .address("Retail Front Counter")
                .currentCreditBalance(BigDecimal.ZERO)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        customerRepository.save(walkIn);

        createCategory(tenantId, owner.getId(), "Inventory Purchase", "EXPENSE");
        createCategory(tenantId, owner.getId(), "Rent & Utilities", "EXPENSE");
        createCategory(tenantId, owner.getId(), "Salaries", "EXPENSE");
        createCategory(tenantId, owner.getId(), "POS Retail Sales", "INCOME");

        return mapToDTO(tenant, settings, owner);
    }

    public Page<TenantResponseDTO> getTenants(TenantStatus status, PlanTier planTier, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tenant> tenantPage = tenantRepository.searchTenants(status, planTier, query, pageable);

        return tenantPage.map(t -> {
            TenantSettings s = tenantSettingsRepository.findByTenantId(t.getId()).orElse(null);
            List<Users> users = usersRepository.findByTenantId(t.getId());
            Users owner = users.isEmpty() ? null : users.get(0);
            return mapToDTO(t, s, owner);
        });
    }

    public TenantResponseDTO getTenantById(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
        TenantSettings settings = tenantSettingsRepository.findByTenantId(id).orElse(null);
        List<Users> users = usersRepository.findByTenantId(id);
        Users owner = users.isEmpty() ? null : users.get(0);
        return mapToDTO(tenant, settings, owner);
    }

    @Transactional
    public TenantResponseDTO updateStatus(UUID id, TenantStatus status) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
        tenant.setStatus(status);
        tenant = tenantRepository.save(tenant);
        TenantSettings settings = tenantSettingsRepository.findByTenantId(id).orElse(null);
        List<Users> users = usersRepository.findByTenantId(id);
        Users owner = users.isEmpty() ? null : users.get(0);
        return mapToDTO(tenant, settings, owner);
    }

    @Transactional
    public TenantResponseDTO updateSubscription(UUID id, UpdateSubscriptionDTO dto) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));

        if (dto.getPlanTier() != null) {
            tenant.setPlanTier(dto.getPlanTier());
        }

        if (dto.getExpiresAt() != null) {
            tenant.setExpiresAt(dto.getExpiresAt());
        } else if (dto.getExtendDays() != null && dto.getExtendDays() > 0) {
            Instant currentExp = tenant.getExpiresAt() != null && tenant.getExpiresAt().isAfter(Instant.now()) 
                    ? tenant.getExpiresAt() : Instant.now();
            tenant.setExpiresAt(currentExp.plus(dto.getExtendDays(), ChronoUnit.DAYS));
        }

        tenant = tenantRepository.save(tenant);
        TenantSettings settings = tenantSettingsRepository.findByTenantId(id).orElse(null);
        List<Users> users = usersRepository.findByTenantId(id);
        Users owner = users.isEmpty() ? null : users.get(0);
        return mapToDTO(tenant, settings, owner);
    }

    public PlatformMetricsDTO getPlatformMetrics() {
        long total = tenantRepository.count();
        long active = tenantRepository.countByStatus(TenantStatus.ACTIVE);
        long trial = tenantRepository.countByStatus(TenantStatus.TRIAL);
        long suspended = tenantRepository.countByStatus(TenantStatus.SUSPENDED);
        long cancelled = tenantRepository.countByStatus(TenantStatus.CANCELLED);

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long newLast7 = tenantRepository.countByCreatedAtAfter(sevenDaysAgo);

        // Sum sales across all invoices
        List<Invoice> allInvoices = invoiceRepository.findAll();
        BigDecimal totalSales = allInvoices.stream()
                .map(Invoice::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PlatformMetricsDTO.builder()
                .totalTenants(total)
                .activeTenants(active)
                .trialTenants(trial)
                .suspendedTenants(suspended)
                .cancelledTenants(cancelled)
                .newStoresLast7Days(newLast7)
                .totalSalesVolume30Days(totalSales)
                .build();
    }

    public TenantSettings getTenantSettings(UUID tenantId) {
        return tenantSettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> tenantSettingsRepository.save(TenantSettings.builder()
                        .tenantId(tenantId)
                        .allowNegativeStock(false)
                        .build()));
    }

    @Transactional
    public TenantSettings updateTenantSettings(UUID tenantId, TenantSettings request) {
        TenantSettings settings = getTenantSettings(tenantId);
        if (request.getTaxNumber() != null) settings.setTaxNumber(request.getTaxNumber());
        if (request.getTaxRateDefault() != null) settings.setTaxRateDefault(request.getTaxRateDefault());
        if (request.getReceiptHeader() != null) settings.setReceiptHeader(request.getReceiptHeader());
        if (request.getReceiptFooter() != null) settings.setReceiptFooter(request.getReceiptFooter());
        if (request.getLogoUrl() != null) settings.setLogoUrl(request.getLogoUrl());
        if (request.getAllowNegativeStock() != null) settings.setAllowNegativeStock(request.getAllowNegativeStock());
        return tenantSettingsRepository.save(settings);
    }

    private void createCategory(UUID tenantId, Long userId, String name, String type) {
        Categories cat = Categories.builder()
                .tenantId(tenantId)
                .userId(userId)
                .name(name)
                .type(type)
                .sortOrder(0)
                .archived(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        categoriesRepository.save(cat);
    }

    private TenantResponseDTO mapToDTO(Tenant tenant, TenantSettings settings, Users owner) {
        return TenantResponseDTO.builder()
                .id(tenant.getId())
                .storeName(tenant.getStoreName())
                .slug(tenant.getSlug())
                .contactEmail(tenant.getContactEmail())
                .contactPhone(tenant.getContactPhone())
                .currencyCode(tenant.getCurrencyCode())
                .status(tenant.getStatus())
                .planTier(tenant.getPlanTier())
                .expiresAt(tenant.getExpiresAt())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .taxNumber(settings != null ? settings.getTaxNumber() : null)
                .taxRateDefault(settings != null ? settings.getTaxRateDefault() : BigDecimal.ZERO)
                .receiptHeader(settings != null ? settings.getReceiptHeader() : null)
                .receiptFooter(settings != null ? settings.getReceiptFooter() : null)
                .logoUrl(settings != null ? settings.getLogoUrl() : null)
                .allowNegativeStock(settings != null ? settings.getAllowNegativeStock() : false)
                .ownerUserId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .build();
    }
}
