# ExpenseManager - SaaS Multi-Tenant ERP Documentation

## Overview

**ExpenseManager ERP** is an enterprise-grade multi-tenant Software-as-a-Service (SaaS) platform for personal and retail store business management. It enables Super Admins to provision, manage, and monitor tenant stores while ensuring complete data isolation, role-based authorization, and dynamic store branding across POS billing, receipts, inventory, and accounting registers.

---

## Repository Structure

```
ExpenseManager/
├── expensemngr/              # Java 17 / Spring Boot 3 Multi-Tenant Backend API
│   ├── src/main/java/com/practice/expensemngr/
│   │   ├── config/           # Security, TenantContext, TenantSecurityFilter & SubscriptionInterceptor
│   │   ├── controller/       # REST Endpoints (SuperAdminController, POS, Inventory, Register, etc.)
│   │   ├── dto/              # Data Transfer Objects (TenantOnboardingDTO, PlatformMetricsDTO, etc.)
│   │   ├── entity/           # JPA Entities (Tenant, TenantSettings, BaseTenantEntity, Users, Product, etc.)
│   │   ├── repository/       # Multi-tenant Spring Data Repositories
│   │   ├── security/         # JWT Authentication & Role-Based Authorization
│   │   ├── service/          # Service Layer (TenantProvisioningService, InventoryService, InvoiceService)
│   │   └── util/             # JwtUtils with embedded tenantId and role claims
│   └── pom.xml               # Maven configuration
│
└── frontend/                 # React 19 + MUI v7 Multi-Tenant SPA
    ├── src/
    │   ├── api/              # Axios API calls (adminApi, inventoryApi, invoiceApi, registerApi)
    │   ├── components/       # UI Components & Print Engine (ThermalReceipt, DailyAccountStatement, SuperAdminRoute)
    │   ├── context/          # AuthContext (Role & Tenant) + TenantContext (Store Branding)
    │   ├── pages/            # Page Views
    │   │   ├── admin/        # Super Admin Portal (AdminDashboard, AdminStores)
    │   │   └── ...           # Tenant Store Operations (POSBilling, Inventory, Invoices, DailyRegister)
    │   └── theme/            # MUI Theme configuration
    └── package.json          # Node dependencies & scripts
```

---

## Multi-Tenant Architecture & Isolation Engine

### 1. Domain Entities & Superclass
- **`Tenant`**: Stores UUID, store name, unique URL slug, owner email/phone, currency, status (`TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`), plan tier (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`), and expiration timestamp.
- **`TenantSettings`**: Stores tax registration numbers, default tax rates, custom receipt headers, footers, logo URLs, and negative stock policy flags.
- **`BaseTenantEntity`**: `@MappedSuperclass` extended by all store entities (`Product`, `StockMovement`, `Customer`, `Invoice`, `InvoiceItem`, `DailyRegisterSession`, `Accounts`, `Transactions`, `Categories`, `Budgets`). Features an `@PrePersist` listener for auto-populating `tenantId` from `TenantContext`.

### 2. Thread-Local Tenant Context & Filters
- **`TenantContext`**: Manages `ThreadLocal<UUID> currentTenant` per thread.
- **`TenantSecurityFilter`**: Placed after JWT authentication filter to parse `tenantId` and `role` claims from tokens. Supports Super Admin impersonation via `X-Tenant-Id` header.
- **`TenantSubscriptionInterceptor`**: Intercepts requests for store users. If store status is `SUSPENDED`, `CANCELLED`, or expired, blocks execution with `403 Forbidden` (`{"error": "TENANT_ACCOUNT_INACTIVE"}`).

---

## Super Admin Portal & Onboarding Workflow

### Super Admin Endpoints (`/admin/**`)
- `POST /admin/tenants`: Provisions a new store tenant, creates `TenantSettings`, registers owner user (`ROLE_STORE_ADMIN`), and seeds baseline cash drawers, bank accounts, walk-in customer, and standard expense categories atomically.
- `GET /admin/tenants`: Paginated list of store tenants filtered by status, plan tier, or search query.
- `PUT /admin/tenants/{id}/status`: Toggle store status (`ACTIVE` vs `SUSPENDED`).
- `PUT /admin/tenants/{id}/subscription`: Extend expiration dates and update subscription tiers.
- `GET /admin/metrics`: Platform aggregated KPIs (Total Stores, Active vs Suspended, 30-Day POS Volume, New Store Onboardings).

---

## Role-Based Access Control (RBAC)

- **`ROLE_SUPER_ADMIN`**: Full platform control, access to `/admin/**` portal, impersonation rights via `X-Tenant-Id`.
- **`ROLE_STORE_ADMIN`**: Store-level administrative access to POS, inventory, billing, accounts, and daily register closures.
- **`ROLE_CASHIER`**: POS checkout and invoice generation.
- **`ROLE_INVENTORY_MANAGER`**: Product catalog and stock restock management.

---

## Frontend Multi-Tenant Store Branding

- **`AuthContext`**: Stores JWT, user role, `tenantId`, `storeName`, and `tenantSettings`.
- **`TenantContext`**: Exposes `useTenant()` hook providing localized store headers, footers, logo URLs, and tax numbers.
- **`ThermalReceipt.jsx` & `DailyAccountStatement.jsx`**: Dynamically render tenant-specific receipt headers, tax IDs, and custom footers during 80mm thermal and A4 print executions.

---

## Default Seeded Credentials

1. **Super Admin Platform Login**:
   - **Email:** `admin@saas.com`
   - **Password:** `admin123`
   - **Role:** `ROLE_SUPER_ADMIN`
   - **Portal Route:** `/admin/dashboard`

2. **Default Store Tenant Login**:
   - **Store Name:** Main Retail Store (slug: `main-store`)
   - **Email:** `guest@example.com`
   - **Password:** `guest123`
   - **Role:** `ROLE_STORE_ADMIN`
   - **Store Operations Route:** `/pos`, `/inventory`, `/register`

---

## Running Locally

### Backend (`expensemngr`)
```bash
cd expensemngr
chmod +x ./mvnw
./mvnw spring-boot:run
```

### Frontend (`frontend`)
```bash
cd frontend
npm install
npm start
```
