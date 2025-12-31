package com.practice.expensemngr.exception;

import java.math.BigDecimal;

/**
 * Exception thrown when trying to archive account with non-zero balance
 */
public class AccountHasBalanceException extends RuntimeException {

    public AccountHasBalanceException(BigDecimal balance) {
        super("Cannot archive account with non-zero balance: " + balance + ". Please transfer funds first or confirm archival.");
    }
}