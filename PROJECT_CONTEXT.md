# ExpenseManager - Project Context & Documentation

## Overview

**ExpenseManager ERP** is an integrated full-stack personal & business finance, billing, inventory, and expense management platform. It combines core financial ledger features with a Point-of-Sale (POS) terminal, inventory stock tracking, customer accounts, thermal receipt printing, and daily register session closure (Z-Report statements).

---

## Repository Structure

```
ExpenseManager/
├── expensemngr/              # Java / Spring Boot Backend API
│   ├── src/main/java/com/practice/expensemngr/
│   │   ├── config/           # Application, Security & DataSeeder configuration
│   │   ├── controller/       # REST API Endpoints (27 controllers including POS, Stock & Register)
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entity/           # JPA Domain Entities (Product, StockMovement, Customer, Invoice, InvoiceItem, DailyRegisterSession, etc.)
│   │   ├── repository/       # Data Access Repositories
│   │   ├── security/         # JWT Auth & Security filters
│   │   ├── service/          # Business logic & transactional services (InventoryService, InvoiceService, DailyRegisterService, etc.)
│   │   └── util/             # Utility classes (file storage, export, etc.)
│   ├── FRONTEND_CONTEXT.md   # API & Dashboard specification reference
│   └── pom.xml               # Maven configuration
│
└── frontend/                 # React Single Page Application (SPA)
    ├── src/
    │   ├── api/              # Axios API service calls (inventoryApi, invoiceApi, customerApi, registerApi)
    │   ├── components/       # Reusable UI components & Print Engine (ThermalReceipt, DailyAccountStatement)
    │   ├── context/          # React Context (Auth, Theme)
    │   ├── pages/            # Page Views (POSBilling, Inventory, Invoices, DailyRegister, Dashboard, etc.)
    │   └── theme/            # MUI Theme configuration
    └── package.json          # Node dependencies & scripts
```

---

## Tech Stack

### Backend (`expensemngr`)
- **Language & Framework:** Java 17+, Spring Boot 3
- **Security:** Spring Security + JWT (JSON Web Tokens) + BCrypt
- **Persistence:** Spring Data JPA / Hibernate (SQL database compatible)
- **Build Tool:** Maven (`pom.xml`)
- **Key Modules:** Spring Web, Spring Security, Spring Data JPA, Transactional Management, File Upload, CSV Export

### Frontend (`frontend`)
- **Framework:** React 19 + React Router v7
- **UI Library:** Material-UI (MUI v7), `@emotion/react`, `@emotion/styled`
- **Print Engine:** CSS `@media print` + Thermal Receipt (80mm/58mm) & A4 Z-Report Financial Statements
- **Charts & Visualization:** Chart.js + `react-chartjs-2`
- **Form Management:** `react-hook-form`
- **HTTP Client:** `axios`
- **Date Handling:** `date-fns`

---

## Core Domain Features

### 1. Point-of-Sale (POS) Terminal & Billing (`/pos`)
- **Fast Checkout Interface:** Barcode scanner input and fast search by name or SKU.
- **Cart Management:** Line item quantity controls, discount adjustments, unit price overrides.
- **Customer Assignment:** Link invoices to customer ledgers or default to Walk-in Customer.
- **Multi-Channel Payments:** Process transactions via Cash, Debit/Credit Card, Bank Transfer, or Customer Credit.
- **Automated Ledger Credit:** Checkout atomically deducts product stock, records stock movements, and credits the target bank/cash ledger account with income (`Transactions`).
- **Thermal Receipt Printing:** Instant 80mm/58mm thermal paper receipt preview and print trigger.

### 2. Product Catalog & Inventory Management (`/inventory`)
- **Stock Tracking:** Track current stock, SKU codes, barcodes, cost prices (buying), selling prices (retail), and reorder warning levels.
- **Status Badges:** Real-time stock status (`In Stock`, `Low Stock Alert`, `Out of Stock`).
- **Automated Expense Restocking:** Restocking inventory automatically generates an `EXPENSE` transaction in the financial ledger against the selected payment account.

### 3. Sales Invoices & Billing History (`/invoices`)
- **Historic Invoice Table:** Filter invoices by payment status (`PAID`, `PARTIALLY_PAID`, `UNPAID`) and date range.
- **Reprint Receipts:** View line item details and reprint thermal receipts at any time.

### 4. Daily Register & Financial Reconciliation (`/register`)
- **Session Management:** Open daily session with initial cash float; close session with counted cash drawer balance.
- **Variance Calculation:** Automatically calculates expected cash (`Opening Float + Cash Sales - Cash Expenses`) vs. actual counted cash, highlighting overage or shortage.
- **Printable Z-Report Statement:** Print-ready A4 Daily Account Statement with channel breakdown, cash float reconciliation, and manager sign-off lines.

### 5. Multi-Account & Multi-Currency Management (`/accounts`)
- **Account Ledger:** Manage Cash Drawers, Bank Accounts, Credit Cards, and Wallets in multiple currencies.

### 6. Budgets, Analytics & Data Export (`/budgets`, `/reports`)
- **Financial Analytics:** Overview dashboards, category spending pie charts, and downloadable CSV exports.

---

## API Controller Mapping

| Controller | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| `ProductController` | `/products` | Product catalog CRUD, search, low-stock query, and restocking |
| `StockController` | `/stock` | Stock adjustments and stock movement audit trail |
| `CustomerController` | `/customers` | Customer catalog and credit balance tracking |
| `InvoiceController` | `/invoices` | POS invoice creation, filtering, and detail lookups |
| `RegisterController` | `/register` | Register session open/close, active status, and daily Z-report summary |
| `AuthController` | `/auth` | User registration & JWT authentication |
| `AccountsController` | `/accounts` | CRUD operations for bank/cash accounts |
| `TransactionsController` | `/transactions` | Income/Expense logging, transfers |
| `TransactionSearchController` | `/transactions/search` | Advanced filtering and query search |
| `AttachmentsController` | `/attachments` | Receipt image/file upload and retrieval |
| `BudgetsController` | `/budgets` | Budget creation and status monitoring |
| `RecurringRulesController` | `/recurring` | Automated recurring transaction setup |
| `DashboardController` | `/dashboard` | Main dashboard summary & chart data |
| `ReportController` | `/reports` | Financial analysis reporting |
| `ExportController` | `/export` | CSV transaction export |
| `CurrenciesController` | `/currencies` | Currency definitions |
| `ExchangeRatesController` | `/exchange-rates` | Multi-currency conversion rates |
| `CategoriesController` | `/categories` | Expense and income categories |
| `TagsController` | `/tags` | Custom transaction tagging |
| `MerchantsController` | `/merchants` | Merchant cataloging |
| `PaymentMethodsController` | `/payment-methods` | Credit card / payment method management |
| `NotificationPreferencesController` | `/notifications` | Alert rules and preference settings |
| `AuditLogsController` | `/audit-logs` | System activity and audit trail |

---

## Getting Started / Running Locally

### Backend Setup (`expensemngr`)

```bash
cd expensemngr
chmod +x ./mvnw
./mvnw spring-boot:run
```

*(Runs on default port `8080`)*

### Frontend Setup (`frontend`)

```bash
cd frontend
npm install
npm start
```

*(Runs on `http://localhost:3000`)*
