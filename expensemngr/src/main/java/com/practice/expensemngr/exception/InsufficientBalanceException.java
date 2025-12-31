package com.practice.expensemngr.exception;

import java.math.BigDecimal;

/**
 * Exception thrown when account has insufficient balance for expense
 */
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(BigDecimal currentBalance, BigDecimal expenseAmount) {
        super("Insufficient balance. Current: " + currentBalance + ", Required: " + expenseAmount + ". Add ?allowNegative=true to proceed.");
    }
}