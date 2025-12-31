package com.practice.expensemngr.exception;

/**
 * Exception thrown when budget is not found
 */
public class BudgetNotFoundException extends RuntimeException {

    public BudgetNotFoundException(Long budgetId) {
        super("Budget not found with ID: " + budgetId);
    }
}