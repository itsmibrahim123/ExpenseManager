package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for listing notification preferences with channel availability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<NotificationPreferenceDTO> preferences;
    private Map<String, Boolean> channelAvailability; // Channel -> Available
    private Integer totalCount;
}