package com.practice.expensemngr.exception;

/**
 * Exception thrown when budget item is not found
 */
public class BudgetItemNotFoundException extends RuntimeException {

    public BudgetItemNotFoundException(Long itemId) {
        super("Budget item not found with ID: " + itemId);
    }
}