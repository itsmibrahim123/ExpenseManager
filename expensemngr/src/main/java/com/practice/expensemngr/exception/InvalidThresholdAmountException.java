package com.practice.expensemngr.exception;

/**
 * Exception thrown when threshold amount is invalid
 */
public class InvalidThresholdAmountException extends RuntimeException {

    public InvalidThresholdAmountException() {
        super("Threshold amount must be greater than or equal to 0");
    }

    public InvalidThresholdAmountException(String message) {
        super(message);
    }
}