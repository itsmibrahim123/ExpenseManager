package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when transaction amount is invalid
 */
public class InvalidAmountException extends RuntimeException {

    public InvalidAmountException() {
        super("Transaction amount must be greater than zero");
    }
}