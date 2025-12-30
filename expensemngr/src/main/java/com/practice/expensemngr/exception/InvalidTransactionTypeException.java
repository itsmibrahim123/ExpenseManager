package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when transaction type is invalid
 */
public class InvalidTransactionTypeException extends RuntimeException {

    public InvalidTransactionTypeException(String type) {
        super("Invalid transaction type: " + type + ". Must be EXPENSE or INCOME.");
    }
}