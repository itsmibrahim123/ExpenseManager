package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attempting to register a user with an email that already exists
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String email) {
        super("User with email '" + email + "' already exists");
    }
}