package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when transaction is not found
 */
public class TransactionNotFoundException extends RuntimeException {

    public TransactionNotFoundException(Long transactionId) {
        super("Transaction not found with ID: " + transactionId);
    }
}