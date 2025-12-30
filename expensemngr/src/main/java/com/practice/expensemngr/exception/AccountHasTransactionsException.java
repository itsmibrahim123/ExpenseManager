package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when trying to modify account that has transactions
 */
public class AccountHasTransactionsException extends RuntimeException {

    public AccountHasTransactionsException() {
        super("Cannot modify currency for account with existing transactions");
    }
}