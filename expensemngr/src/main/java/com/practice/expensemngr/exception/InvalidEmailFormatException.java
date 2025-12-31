package com.practice.expensemngr.exception;

/**
 * Exception thrown when email format is invalid
 */
public class InvalidEmailFormatException extends RuntimeException {

    public InvalidEmailFormatException(String email) {
        super("Invalid email format: '" + email + "'");
    }
}