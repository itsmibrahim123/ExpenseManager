# Frontend Development Context & Dashboard Plan

This document outlines the frontend components and dashboards required to interact with the Expense Manager backend API. It's derived from the available controllers and their endpoints.

---

## 1. Core Dashboards

### 1.1. Main Dashboard (`/dashboard`)

This is the primary landing page after a user logs in. It provides a high-level overview of their financial status.

**Backend Controller:** `ReportController`
**Endpoint:** `GET /api/reports/dashboard`

**Frontend Components:**
- **Stat Cards:**
    - `Total Balance`: Displays the sum of all account balances.
    - `Income This Month`: Shows total income for the current month.
    - `Expense This Month`: Shows total expenses for the current month.
- **Charts:**
    - **Expense by Category:** A pie or donut chart visualizing spending distribution across different categories for the current month.
- **Quick Actions:**
    - "Add Expense" button.
    - "Add Income" button.
    - "Make a Transfer" button.

---

## 2. Feature-Specific Pages & Components

### 2.1. Authentication (`/login`, `/register`)

Handles user registration and login.

**Backend Controller:** `AuthController`
**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`

**Frontend Components:**
- **Registration Page:** A form with fields for Full Name, Email, Password, and an optional "Preferred Currency" dropdown.
- **Login Page:** A simple form for Email and Password.

### 2.2. Accounts Management (`/accounts`)

Allows users to view and manage their financial accounts (e.g., Bank Account, Cash, Credit Card).

**Backend Controller:** `AccountsController`
**Endpoints:**
- `GET /api/accounts`: List all user accounts.
- `POST /api/accounts`: Create a new account.
- `PUT /api/accounts/{id}`: Update an account.
- `DELETE /api/accounts/{id}`: Delete an account.

**Frontend Components:**
- **Accounts List:** A page displaying a list/grid of user accounts. Each item should show the account name, type, and current balance.
- **Create/Edit Account Form:** A modal or separate page with fields for Name, Type (e.g., 'Savings', 'Checking'), Initial Balance, and Currency.
- **Delete Confirmation:** A modal to confirm account deletion.

### 2.3. Transactions Management (`/transactions`)

Core feature for recording and viewing all financial activities.

**Backend Controller:** `TransactionsController`
**Endpoints:**
- `GET /api/transactions`: Get a list of all transactions.
- `POST /api/transactions`: Record a new expense or income.
- `POST /api/transactions/transfer`: Transfer funds between accounts.
- `GET /api/transactions/search`: Filter transactions based on criteria.
- `POST /api/transactions/{id}/attachment`: Upload a receipt image for a transaction.

**Frontend Components:**
- **Transactions Table/List:** A detailed, paginated table showing recent transactions with columns for Date, Category, Type (Income/Expense), Amount, and Account.
- **Record Transaction Form:** A comprehensive form (likely in a modal) for adding income or expenses. Fields:
    - Type (toggle between 'Expense' and 'Income').
    - Amount.
    - Date.
    - Category (dropdown populated from `CategoriesController`).
    - Account (dropdown of user's accounts).
    - Description (optional).
- **Fund Transfer Form:** A dedicated form for transfers. Fields:
    - From Account (dropdown).
    - To Account (dropdown).
    - Amount.
    - Date.
    - Description (optional).
- **Advanced Filtering Bar:** Controls to search transactions by date range, category, amount range, and text in the description.
- **Transaction Detail View:** A view to show details of a single transaction, including an area to upload or view an attached receipt.
- **File Uploader:** A component to handle file selection and upload for receipts.

### 2.4. Budgets (`/budgets`)

For setting and tracking spending limits on various categories.

**Backend Controller:** `BudgetsController`
**Endpoints:**
- `GET /api/budgets`: Get status of all budgets (limit, spent, percentage).
- `POST /api/budgets`: Create a new budget.

**Frontend Components:**
- **Budget Dashboard:** A page displaying all created budgets. Each budget should be visualized with:
    - Category Name.
    - Progress Bar showing `spentAmount` vs. `limitAmount`.
    - Text indicating `XX% used`.
    - Visual cues (e.g., color changes to yellow/red) as the budget nears its limit.
- **Create Budget Form:** A form to set a new budget. Fields:
    - Category (dropdown).
    - Limit Amount.
    - Start Date & End Date (date pickers).

### 2.5. Recurring Transactions (`/recurring`)

Manage automated recurring payments and income like salaries, subscriptions, and bills.

**Backend Controller:** `RecurringRulesController`
**Endpoints:**
- `GET /api/recurring`: List all defined recurring rules.
- `POST /api/recurring`: Create a new recurring rule.

**Frontend Components:**
- **Recurring Rules List:** A table showing all active recurring transactions, their frequency, next run date, and amount.
- **Create Rule Form:** A form to set up a new rule. Fields:
    - Type (Expense/Income).
    - Amount.
    - Account.
    - Category.
    - Frequency (dropdown: e.g., 'Monthly', 'Weekly').
    - Start Date.
    - Description.

---

## 3. Settings & Configuration

This section would live under a `/settings` route with nested navigation.

### 3.1. User Profile (`/settings/profile`)

**Backend Controller:** `UsersController` (and `AuthController` for context)

**Frontend Components:**
- A form to update user's Full Name, Password, and Preferred Currency.

### 3.2. Categories (`/settings/categories`)

**Backend Controller:** `CategoriesController`

**Frontend Components:**
- A CRUD interface to manage expense/income categories. Users can add, rename, or delete categories. This will populate the dropdowns in other forms.

### 3.3. Payment Methods (`/settings/payment-methods`)

**Backend Controller:** `PaymentMethodsController`

**Frontend Components:**
- A CRUD interface to manage payment methods (e.g., 'Credit Card ending in 1234').

### 3.4. Notification Preferences (`/settings/notifications`)

**Backend Controller:** `NotificationPreferencesController`
**Endpoints:**
- `GET /api/notifications`
- `POST /api/notifications`

**Frontend Components:**
- **Notification Settings Form:**
    - Toggles for 'Email Enabled' and 'SMS Enabled'.
    - Input for 'Large Expense Threshold' (e.g., alert me for any expense over $500).
    - Input for 'Budget Warning Percent' (e.g., alert me when I've used 90% of a budget).

### 3.5. Data Export (`/settings/data`)

**Backend Controller:** `ExportController`
**Endpoint:** `GET /api/export/transactions`

**Frontend Components:**
- A section with a "Download Transactions (CSV)" button that triggers the API call and initiates a file download.
