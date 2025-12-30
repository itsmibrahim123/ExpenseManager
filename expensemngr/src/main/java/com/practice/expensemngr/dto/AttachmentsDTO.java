package io.saadmughal.assignment05.dto;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class AttachmentsDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long transactionId;

    private String fileName;

    private String filePath;

    private String mimeType;

    private Long fileSizeBytes;

    private Date uploadedAt;

}
