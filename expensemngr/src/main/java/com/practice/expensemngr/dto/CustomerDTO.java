package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {

    private Long id;

    @NotBlank(message = "Customer name is required")
    private String name;

    private String phone;

    private String email;

    private String address;

    private String taxId;

    private BigDecimal currentCreditBalance;

    private Date createdAt;

    private Date updatedAt;
}
