package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class NotificationPreferencesQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private Long userId;

    private String type;

    private String channel;

    private Boolean enabled;

    private BigDecimal thresholdAmount;

}
