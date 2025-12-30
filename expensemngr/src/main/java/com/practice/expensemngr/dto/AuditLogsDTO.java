package io.saadmughal.assignment05.dto;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class AuditLogsDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String entityType;

    private Long entityId;

    private String action;

    private String details;

    private Date timestamp;

}
