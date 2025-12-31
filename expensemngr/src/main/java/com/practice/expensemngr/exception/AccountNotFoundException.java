package com.practice.expensemngr.exception;

/**
 * Exception thrown when account is not found
 */
public class AccountNotFoundException extends RuntimeException {

    public AccountNotFoundException(Long accountId) {
        super("Account not found with ID: " + accountId);
    }
}