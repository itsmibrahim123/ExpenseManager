package com.practice.expensemngr.exception;

/**
 * Exception thrown when login credentials are invalid
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid email or password");
    }
}