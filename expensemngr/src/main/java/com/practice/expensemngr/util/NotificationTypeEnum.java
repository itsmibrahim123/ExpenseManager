package com.practice.expensemngr.util;

/**
 * Enum for notification alert types
 */
public enum NotificationTypeEnum {
    BUDGET_THRESHOLD("Budget Threshold Alert", "Triggered when budget exceeds warning percentage"),
    LARGE_EXPENSE("Large Expense Alert", "Triggered when single expense exceeds threshold"),
    RECURRING_FAILURE("Recurring Transaction Failure", "Triggered when recurring transaction fails");

    private final String displayName;
    private final String description;

    NotificationTypeEnum(String displayName, String description) {
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