package io.saadmughal.assignment05.util;

import io.saadmughal.assignment05.exception.InvalidEmailFormatException;

import java.util.regex.Pattern;

/**
 * Utility class for email validation
 */
public class EmailValidator {

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    /**
     * Validates email format
     * @param email the email to validate
     * @throws InvalidEmailFormatException if email format is invalid
     */
    public static void validate(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new InvalidEmailFormatException("Email cannot be empty");
        }

        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new InvalidEmailFormatException(email);
        }
    }
}