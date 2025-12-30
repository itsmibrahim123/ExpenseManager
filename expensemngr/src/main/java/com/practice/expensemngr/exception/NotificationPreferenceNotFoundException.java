package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when notification preference is not found
 */
public class NotificationPreferenceNotFoundException extends RuntimeException {

    public NotificationPreferenceNotFoundException(Long preferenceId) {
        super("Notification preference not found with ID: " + preferenceId);
    }
}