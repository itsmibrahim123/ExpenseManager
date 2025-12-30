package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * DTO for notification channel availability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelAvailabilityDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String channel;
    private Boolean available;
    private String reason; // Reason if unavailable
}