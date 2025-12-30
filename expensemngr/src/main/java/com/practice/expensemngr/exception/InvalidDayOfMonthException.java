package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when day of month is invalid
 */
public class InvalidDayOfMonthException extends RuntimeException {

    public InvalidDayOfMonthException(Integer day) {
        super("Invalid day of month: " + day + ". Must be between 1 and 31.");
    }
}