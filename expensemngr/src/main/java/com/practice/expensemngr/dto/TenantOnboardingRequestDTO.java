package com.practice.expensemngr.dto;

import com.practice.expensemngr.entity.PlanTier;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TenantOnboardingRequestDTO {

    @NotBlank(message = "Store name is required")
    private String storeName;

    @NotBlank(message = "Store slug is required")
    private String slug;

    @NotBlank(message = "Owner full name is required")
    private String ownerName;

    @NotBlank(message = "Owner email is required")
    @Email(message = "Invalid email format")
    private String ownerEmail;

    @NotBlank(message = "Owner password is required")
    private String ownerPassword;

    private String contactPhone;

    private String currencyCode = "PKR";

    private PlanTier planTier = PlanTier.STARTER;

    private Integer trialDays = 14;
}
