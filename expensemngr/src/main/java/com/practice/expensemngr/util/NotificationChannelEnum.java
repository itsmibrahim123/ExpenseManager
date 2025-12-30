package io.saadmughal.assignment05.util;

/**
 * Enum for notification delivery channels
 */
public enum NotificationChannelEnum {
    EMAIL("Email", "Email notifications"),
    PUSH("Push Notification", "Mobile push notifications"),
    SMS("SMS", "Text message notifications"),
    IN_APP("In-App", "In-application notifications");

    private final String displayName;
    private final String description;

    NotificationChannelEnum(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}