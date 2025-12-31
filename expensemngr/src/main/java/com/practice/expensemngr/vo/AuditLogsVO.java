package com.practice.expensemngr.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.Date;

@Data
public class AuditLogsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    private Long userId;

    @NotNull(message = "entityType can not null")
    private String entityType;

    private Long entityId;

    @NotNull(message = "action can not null")
    private String action;

    private String details;

    @NotNull(message = "timestamp can not null")
    private Date timestamp;

}
