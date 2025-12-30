package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.*;
import io.saadmughal.assignment05.entity.NotificationPreferences;
import io.saadmughal.assignment05.exception.InvalidThresholdAmountException;
import io.saadmughal.assignment05.exception.NotificationPreferenceNotFoundException;
import io.saadmughal.assignment05.repository.NotificationPreferencesRepository;
import io.saadmughal.assignment05.util.NotificationChannelEnum;
import io.saadmughal.assignment05.util.NotificationTypeEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationPreferencesService {

    @Autowired
    private NotificationPreferencesRepository notificationPreferencesRepository;

    @Value("${notification.channel.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${notification.channel.push.enabled:false}")
    private boolean pushEnabled;

    @Value("${notification.channel.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${notification.channel.inapp.enabled:true}")
    private boolean inAppEnabled;

    /**
     * Create a new notification preference
     * @param request Preference creation data
     * @return Created preference
     */
    @Transactional
    public NotificationPreferenceDTO createPreference(NotificationPreferenceCreateDTO request) {
        // 1. Validate threshold amount if LARGE_EXPENSE
        if ("LARGE_EXPENSE".equals(request.getType())) {
            if (request.getThresholdAmount() == null) {
                throw new InvalidThresholdAmountException("Threshold amount is required for LARGE_EXPENSE type");
            }
            if (request.getThresholdAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidThresholdAmountException();
            }
        }

        // 2. Check if preference already exists
        Optional<NotificationPreferences> existing = notificationPreferencesRepository
                .findByUserIdAndTypeAndChannel(request.getUserId(), request.getType(), request.getChannel());

        if (existing.isPresent()) {
            // Update existing instead of creating duplicate
            NotificationPreferences preference = existing.get();
            preference.setEnabled(request.getEnabled());
            preference.setThresholdAmount(request.getThresholdAmount());
            preference.setUpdatedAt(new Date());
            preference = notificationPreferencesRepository.save(preference);
            return toDTO(preference);
        }

        // 3. Create new preference
        NotificationPreferences preference = NotificationPreferences.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .channel(request.getChannel())
                .enabled(request.getEnabled())
                .thresholdAmount(request.getThresholdAmount())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        preference = notificationPreferencesRepository.save(preference);

        return toDTO(preference);
    }

    /**
     * Get all notification preferences for a user
     * @param userId User ID
     * @return Preferences with channel availability
     */
    public NotificationPreferencesResponseDTO getPreferencesByUser(Long userId) {
        // 1. Get all user preferences
        List<NotificationPreferences> preferences = notificationPreferencesRepository.findByUserId(userId);

        // 2. Convert to DTOs
        List<NotificationPreferenceDTO> preferenceDTOs = preferences.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        // 3. Build channel availability map
        Map<String, Boolean> channelAvailability = new HashMap<>();
        channelAvailability.put("EMAIL", emailEnabled);
        channelAvailability.put("PUSH", pushEnabled);
        channelAvailability.put("SMS", smsEnabled);
        channelAvailability.put("IN_APP", inAppEnabled);

        // 4. Build response
        return NotificationPreferencesResponseDTO.builder()
                .preferences(preferenceDTOs)
                .channelAvailability(channelAvailability)
                .totalCount(preferenceDTOs.size())
                .build();
    }

    /**
     * Get single notification preference by ID
     * @param preferenceId Preference ID
     * @return Preference details
     */
    public NotificationPreferenceDTO getPreferenceById(Long preferenceId) {
        NotificationPreferences preference = notificationPreferencesRepository.findById(preferenceId)
                .orElseThrow(() -> new NotificationPreferenceNotFoundException(preferenceId));

        return toDTO(preference);
    }

    /**
     * Update notification preference
     * @param preferenceId Preference ID
     * @param request Update data
     * @return Updated preference
     */
    @Transactional
    public NotificationPreferenceDTO updatePreference(Long preferenceId,
                                                      NotificationPreferenceUpdateDTO request) {
        // 1. Find existing preference
        NotificationPreferences preference = notificationPreferencesRepository.findById(preferenceId)
                .orElseThrow(() -> new NotificationPreferenceNotFoundException(preferenceId));

        // 2. Update fields if provided
        if (request.getEnabled() != null) {
            preference.setEnabled(request.getEnabled());
        }

        if (request.getThresholdAmount() != null) {
            if (request.getThresholdAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidThresholdAmountException();
            }
            preference.setThresholdAmount(request.getThresholdAmount());
        }

        preference.setUpdatedAt(new Date());

        // 3. Save and return
        preference = notificationPreferencesRepository.save(preference);
        return toDTO(preference);
    }

    /**
     * Delete notification preference
     * @param preferenceId Preference ID
     */
    @Transactional
    public void deletePreference(Long preferenceId) {
        NotificationPreferences preference = notificationPreferencesRepository.findById(preferenceId)
                .orElseThrow(() -> new NotificationPreferenceNotFoundException(preferenceId));

        notificationPreferencesRepository.delete(preference);
    }

    /**
     * Reset preferences to defaults for a user
     * @param userId User ID
     * @return Created default preferences
     */
    @Transactional
    public NotificationPreferencesResponseDTO resetToDefaults(Long userId) {
        // 1. Delete all existing preferences
        notificationPreferencesRepository.deleteByUserId(userId);

        // 2. Create default preferences
        createDefaultPreferences(userId);

        // 3. Return new preferences
        return getPreferencesByUser(userId);
    }

    /**
     * Create default notification preferences for a new user
     * @param userId User ID
     */
    @Transactional
    public void createDefaultPreferences(Long userId) {
        List<NotificationPreferences> defaults = new ArrayList<>();

        // Budget threshold - IN_APP only (enabled)
        defaults.add(NotificationPreferences.builder()
                .userId(userId)
                .type("BUDGET_THRESHOLD")
                .channel("IN_APP")
                .enabled(true)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        // Large expense - IN_APP only (enabled, threshold 1000)
        defaults.add(NotificationPreferences.builder()
                .userId(userId)
                .type("LARGE_EXPENSE")
                .channel("IN_APP")
                .enabled(true)
                .thresholdAmount(new BigDecimal("1000.00"))
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        // Recurring failure - IN_APP only (enabled)
        defaults.add(NotificationPreferences.builder()
                .userId(userId)
                .type("RECURRING_FAILURE")
                .channel("IN_APP")
                .enabled(true)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        notificationPreferencesRepository.saveAll(defaults);
    }

    /**
     * Check if user has a specific alert enabled for a channel
     * @param userId User ID
     * @param type Alert type
     * @param channel Delivery channel
     * @return true if enabled
     */
    public boolean isAlertEnabled(Long userId, String type, String channel) {
        return notificationPreferencesRepository
                .findByUserIdAndTypeAndChannel(userId, type, channel)
                .map(NotificationPreferences::getEnabled)
                .orElse(false);
    }

    /**
     * Get threshold amount for large expense alerts
     * @param userId User ID
     * @param channel Delivery channel
     * @return Threshold amount or null
     */
    public BigDecimal getLargeExpenseThreshold(Long userId, String channel) {
        return notificationPreferencesRepository
                .findByUserIdAndTypeAndChannel(userId, "LARGE_EXPENSE", channel)
                .map(NotificationPreferences::getThresholdAmount)
                .orElse(null);
    }

    /**
     * Get all enabled channels for a specific alert type
     * @param userId User ID
     * @param type Alert type
     * @return List of enabled channels
     */
    public List<String> getEnabledChannels(Long userId, String type) {
        return notificationPreferencesRepository.findByUserIdAndType(userId, type).stream()
                .filter(NotificationPreferences::getEnabled)
                .map(NotificationPreferences::getChannel)
                .collect(Collectors.toList());
    }

    /**
     * Convert entity to DTO
     */
    private NotificationPreferenceDTO toDTO(NotificationPreferences preference) {
        // Get display names from enums
        String typeDisplayName = null;
        String typeDescription = null;
        try {
            NotificationTypeEnum typeEnum = NotificationTypeEnum.valueOf(preference.getType());
            typeDisplayName = typeEnum.getDisplayName();
            typeDescription = typeEnum.getDescription();
        } catch (IllegalArgumentException e) {
            typeDisplayName = preference.getType();
        }

        String channelDisplayName = null;
        try {
            NotificationChannelEnum channelEnum = NotificationChannelEnum.valueOf(preference.getChannel());
            channelDisplayName = channelEnum.getDisplayName();
        } catch (IllegalArgumentException e) {
            channelDisplayName = preference.getChannel();
        }

        return NotificationPreferenceDTO.builder()
                .id(preference.getId())
                .userId(preference.getUserId())
                .type(preference.getType())
                .channel(preference.getChannel())
                .enabled(preference.getEnabled())
                .thresholdAmount(preference.getThresholdAmount())
                .createdAt(preference.getCreatedAt())
                .updatedAt(preference.getUpdatedAt())
                .typeDisplayName(typeDisplayName)
                .typeDescription(typeDescription)
                .channelDisplayName(channelDisplayName)
                .build();
    }
}