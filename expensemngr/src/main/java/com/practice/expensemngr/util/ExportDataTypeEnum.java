package com.practice.expensemngr.util;

/**
 * Enum for types of data that can be exported
 */
public enum ExportDataTypeEnum {
    TRANSACTIONS("Transactions", "Financial transactions"),
    ACCOUNTS("Accounts", "Account list"),
    BUDGETS("Budgets", "Budget data with items"),
    CATEGORIES("Categories", "Category list"),
    ALL("All Data", "Complete data backup");

    private final String displayName;
    private final String description;

    ExportDataTypeEnum(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}