package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long>, JpaSpecificationExecutor<NotificationPreferences> {

    /**
     * Find all notification preferences for a user
     * @param userId User ID
     * @return List of preferences
     */
    List<NotificationPreferences> findByUserId(Long userId);

    /**
     * Find preferences by user and type
     * @param userId User ID
     * @param type Notification type
     * @return List of preferences
     */
    List<NotificationPreferences> findByUserIdAndType(Long userId, String type);

    /**
     * Find preference by user, type, and channel
     * @param userId User ID
     * @param type Notification type
     * @param channel Notification channel
     * @return Optional preference
     */
    Optional<NotificationPreferences> findByUserIdAndTypeAndChannel(Long userId, String type, String channel);

    /**
     * Delete all preferences for a user
     * @param userId User ID
     */
    void deleteByUserId(Long userId);
}