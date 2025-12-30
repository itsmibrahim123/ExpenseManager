package io.saadmughal.assignment05.util;

import io.saadmughal.assignment05.exception.WeakPasswordException;

/**
 * Utility class for password validation
 */
public class PasswordValidator {

    private static final int MIN_PASSWORD_LENGTH = 8;

    /**
     * Validates password meets minimum requirements
     * @param password the password to validate
     * @throws WeakPasswordException if password is weak
     */
    public static void validate(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new WeakPasswordException("Password cannot be empty");
        }

        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new WeakPasswordException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters long");
        }
    }
}