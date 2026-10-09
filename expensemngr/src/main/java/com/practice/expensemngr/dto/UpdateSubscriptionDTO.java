package com.practice.expensemngr.dto;

import com.practice.expensemngr.entity.PlanTier;
import lombok.Data;

import java.time.Instant;

@Data
public class UpdateSubscriptionDTO {
    private PlanTier planTier;
    private Instant expiresAt;
    private Integer extendDays;
}
