package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attempting to transfer to the same account
 */
public class SameAccountTransferException extends RuntimeException {

    public SameAccountTransferException() {
        super("Cannot transfer funds to the same account. Source and destination must be different.");
    }
}