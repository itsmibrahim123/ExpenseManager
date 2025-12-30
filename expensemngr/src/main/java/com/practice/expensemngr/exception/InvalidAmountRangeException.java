package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when amount range is invalid
 */
public class InvalidAmountRangeException extends RuntimeException {

    public InvalidAmountRangeException() {
        super("Maximum amount must be greater than or equal to minimum amount");
    }
}