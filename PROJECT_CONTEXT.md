# ExpenseManager - Project Context & Documentation

## Overview

**ExpenseManager** is a full-stack personal finance and expense management platform. It allows users to track income and expenses, manage accounts in multiple currencies, set up budgets and recurring payments, upload receipt attachments, view financial analytics and dashboards, and export transaction data.

---

## Repository Structure

```
ExpenseManager/
├── expensemngr/              # Java / Spring Boot Backend API
│   ├── src/main/java/com/practice/expensemngr/
│   │   ├── config/           # Application & Security configuration
│   │   ├── controller/       # REST API Endpoints (22 controllers)
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entity/           # JPA Domain Entities
│   │   ├── repository/       # Data Access Repositories
│   │   ├── security/         # JWT Auth & Security filters
│   │   ├── service/          # Business logic & services
│   │   └── util/             # Utility classes (file storage, export, etc.)
│   ├── FRONTEND_CONTEXT.md   # API & Dashboard specification reference
│   └── pom.xml               # Maven configuration
│
└── frontend/                 # React Single Page Application (SPA)
    ├── src/
    │   ├── api/              # Axios API service calls
    │   ├── components/       # Reusable UI components (Modals, Charts, Forms)
    │   ├── context/          # React Context (Auth, Theme)
    │   ├── pages/            # Page Views (Dashboard, Transactions, Accounts, etc.)
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
- **Key Modules:** Spring Web, Spring Security, Spring Data JPA, File Upload, CSV Export

### Frontend (`frontend`)
- **Framework:** React 19 + React Router v7
- **UI Library:** Material-UI (MUI v7), `@emotion/react`, `@emotion/styled`
- **Charts & Visualization:** Chart.js + `react-chartjs-2`
- **Form Management:** `react-hook-form`
- **HTTP Client:** `axios`
- **Date Handling:** `date-fns`

---

## Core Domain Features

### 1. Authentication & User Profile
- **JWT Authentication:** Endpoint `POST /api/auth/login` and `POST /api/auth/register`.
- **User Settings:** Profile management, base currency preference, password management.

### 2. Multi-Account & Multi-Currency Management
- **Accounts:** Manage accounts (Checking, Savings, Credit Cards, Cash, Crypto wallets).
- **Currencies & Exchange Rates:** Store and track exchange rates across currencies for multi-currency transaction calculations.

### 3. Transactions & Receipt Uploads
- **Transaction Types:** Income, Expense, and Inter-account Fund Transfers.
- **Categorization & Tagging:** Categorize transactions, associate payment methods, assign merchants, and tag transactions.
- **Receipt Attachments:** Upload image/PDF receipts linked directly to transactions.
- **Advanced Search:** Filter transactions by date range, account, category, amount range, and search text.

### 4. Budgets & Spending Limits
- **Category Budgets:** Define category-specific budget limits per period (monthly, quarterly, yearly).
- **Spending Alerts & Tracking:** Compute spent vs. remaining limit with percentage indicator warnings.

### 5. Recurring Transactions
- **Automation Rules:** Schedule recurring incomes or expenses (weekly, monthly, annually) for automated transaction logging (e.g., salaries, subscriptions, rent).

### 6. Reports, Analytics & Data Export
- **Dashboard Overview:** Stat cards (Total Balance, Monthly Income, Monthly Expense) and category breakdown charts.
- **CSV Data Export:** Download complete transaction histories as CSV files.

### 7. Notifications & Audit Logs
- **Notification Preferences:** Set thresholds for budget limits and large expense alerts.
- **Audit Logging:** Record user operations and system events for security and auditing.

---

## API Controller Mapping

| Controller | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| `AuthController` | `/api/auth` | User registration & JWT authentication |
| `AccountsController` | `/api/accounts` | CRUD operations for bank/cash accounts |
| `TransactionsController` | `/api/transactions` | Income/Expense logging, transfers |
| `TransactionSearchController` | `/api/transactions/search` | Advanced filtering and query search |
| `AttachmentsController` | `/api/attachments` | Receipt image/file upload and retrieval |
| `BudgetsController` | `/api/budgets` | Budget creation and status monitoring |
| `RecurringRulesController` | `/api/recurring` | Automated recurring transaction setup |
| `DashboardController` | `/api/dashboard` | Main dashboard summary & chart data |
| `ReportController` | `/api/reports` | Financial analysis reporting |
| `ExportController` | `/api/export` | CSV transaction export |
| `CurrenciesController` | `/api/currencies` | Currency definitions |
| `ExchangeRatesController` | `/api/exchange-rates` | Multi-currency conversion rates |
| `CategoriesController` | `/api/categories` | Expense and income categories |
| `TagsController` | `/api/tags` | Custom transaction tagging |
| `MerchantsController` | `/api/merchants` | Merchant cataloging |
| `PaymentMethodsController` | `/api/payment-methods` | Credit card / payment method management |
| `NotificationPreferencesController` | `/api/notifications` | Alert rules and preference settings |
| `AuditLogsController` | `/api/audit-logs` | System activity and audit trail |

---

## Getting Started / Running Locally

### Backend Setup (`expensemngr`)
```bash
cd expensemngr
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
