package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when user account is locked
 */
public class AccountLockedException extends RuntimeException {

    public AccountLockedException() {
        super("Account is locked. Please contact support.");
    }
}