package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when budget date range is invalid
 */
public class InvalidDateRangeException extends RuntimeException {

    public InvalidDateRangeException() {
        super("End date must be greater than or equal to start date");
    }
}