package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class AttachmentsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "transactionId can not null")
    private Long transactionId;

    @NotNull(message = "fileName can not null")
    private String fileName;

    @NotNull(message = "filePath can not null")
    private String filePath;

    private String mimeType;

    private Long fileSizeBytes;

    @NotNull(message = "uploadedAt can not null")
    private Date uploadedAt;

}
