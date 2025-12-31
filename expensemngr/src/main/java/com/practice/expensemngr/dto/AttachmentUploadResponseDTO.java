package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * Response DTO for file upload operations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentUploadResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<AttachmentDTO> uploaded;
    private List<String> errors; // List of error messages for failed uploads
    private String message;
    private Integer successCount;
    private Integer failureCount;
}