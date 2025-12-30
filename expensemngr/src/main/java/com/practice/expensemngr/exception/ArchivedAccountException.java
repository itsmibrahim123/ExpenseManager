package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attempting to use archived account
 */
public class ArchivedAccountException extends RuntimeException {

    public ArchivedAccountException(String accountName) {
        super("Cannot use archived account: " + accountName);
    }
}