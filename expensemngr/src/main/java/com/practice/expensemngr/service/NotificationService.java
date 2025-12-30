package io.saadmughal.assignment05.service;

/**
 * Service interface for sending notifications
 * Implementation to be added later for actual email/SMS/push notifications
 */
public interface NotificationService {

    /**
     * Sends a welcome notification to newly registered user
     * @param userId the ID of the newly registered user
     * @param email the user's email address
     * @param fullName the user's full name
     */
    void sendWelcomeNotification(Long userId, String email, String fullName);
}