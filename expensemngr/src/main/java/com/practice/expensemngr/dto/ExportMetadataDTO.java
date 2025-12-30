package io.saadmughal.assignment05.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * Metadata about the exported data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportMetadataDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String dataType;
    private String format;
    private Integer recordCount;
    private String dateRange;
    private Long fileSize; // Size in bytes
    private String fileName;
    private Date generatedAt;
}