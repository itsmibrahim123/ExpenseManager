package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when interval value is invalid
 */
public class InvalidIntervalException extends RuntimeException {

    public InvalidIntervalException() {
        super("Interval must be greater than 0");
    }
}