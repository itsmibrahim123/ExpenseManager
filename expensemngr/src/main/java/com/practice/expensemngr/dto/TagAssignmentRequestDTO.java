package com.practice.expensemngr.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * Request object for assigning a tag to a transaction
 */
@Data
public class TagAssignmentRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "Tag ID is required")
    private Long tagId;
}