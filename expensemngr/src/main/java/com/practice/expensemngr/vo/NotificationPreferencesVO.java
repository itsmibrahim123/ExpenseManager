package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class NotificationPreferencesVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "id can not null")
    private Long id;

    @NotNull(message = "userId can not null")
    private Long userId;

    @NotNull(message = "type can not null")
    private String type;

    @NotNull(message = "channel can not null")
    private String channel;

    @NotNull(message = "enabled can not null")
    private Boolean enabled;

    private BigDecimal thresholdAmount;

}
