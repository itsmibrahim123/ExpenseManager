package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.NotificationPreferenceCreateDTO;
import com.practice.expensemngr.dto.NotificationPreferenceDTO;
import com.practice.expensemngr.dto.NotificationPreferenceUpdateDTO;
import com.practice.expensemngr.dto.NotificationPreferencesResponseDTO;
import com.practice.expensemngr.service.NotificationPreferencesService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notification-preferences")
public class NotificationPreferencesController {

    @Autowired
    private NotificationPreferencesService notificationPreferencesService;

    /**
     * Create a new notification preference
     * @param request Preference creation data
     * @return Created preference
     */
    @PostMapping
    public ResponseEntity<NotificationPreferenceDTO> createPreference(
            @Valid @RequestBody NotificationPreferenceCreateDTO request) {
        NotificationPreferenceDTO preference = notificationPreferencesService.createPreference(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(preference);
    }

    /**
     * Get all notification preferences for a user
     * @param userId User ID
     * @return List of preferences with channel availability
     */
    @GetMapping
    public ResponseEntity<NotificationPreferencesResponseDTO> getPreferencesByUser(
            @RequestParam @NotNull Long userId) {
        NotificationPreferencesResponseDTO response = notificationPreferencesService.getPreferencesByUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get single notification preference by ID
     * @param id Preference ID
     * @return Preference details
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationPreferenceDTO> getPreferenceById(
            @PathVariable @NotNull Long id) {
        NotificationPreferenceDTO preference = notificationPreferencesService.getPreferenceById(id);
        return ResponseEntity.ok(preference);
    }

    /**
     * Update notification preference
     * @param id Preference ID
     * @param request Update data
     * @return Updated preference
     */
    @PutMapping("/{id}")
    public ResponseEntity<NotificationPreferenceDTO> updatePreference(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody NotificationPreferenceUpdateDTO request) {
        NotificationPreferenceDTO preference = notificationPreferencesService.updatePreference(id, request);
        return ResponseEntity.ok(preference);
    }

    /**
     * Delete notification preference
     * @param id Preference ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreference(@PathVariable @NotNull Long id) {
        notificationPreferencesService.deletePreference(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reset preferences to defaults for a user
     * @param userId User ID
     * @return Default preferences
     */
    @PostMapping("/reset")
    public ResponseEntity<NotificationPreferencesResponseDTO> resetToDefaults(
            @RequestParam @NotNull Long userId) {
        NotificationPreferencesResponseDTO response = notificationPreferencesService.resetToDefaults(userId);
        return ResponseEntity.ok(response);
    }
}