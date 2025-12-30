package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when budget period type is invalid
 */
public class InvalidPeriodTypeException extends RuntimeException {

    public InvalidPeriodTypeException(String periodType) {
        super("Invalid period type: " + periodType + ". Must be MONTHLY, WEEKLY, YEARLY, or CUSTOM.");
    }
}