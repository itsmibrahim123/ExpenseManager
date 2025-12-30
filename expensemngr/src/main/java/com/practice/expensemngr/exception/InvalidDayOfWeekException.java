package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when day of week is invalid
 */
public class InvalidDayOfWeekException extends RuntimeException {

    public InvalidDayOfWeekException(String day) {
        super("Invalid day of week: " + day + ". Must be SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, or SATURDAY.");
    }
}