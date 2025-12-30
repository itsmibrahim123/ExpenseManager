package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * DTO for attachment information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long transactionId;
    private String fileName;
    private String filePath;
    private String mimeType;
    private Long fileSizeBytes;
    private Date uploadedAt;
    private String downloadUrl; // URL to download the file
}