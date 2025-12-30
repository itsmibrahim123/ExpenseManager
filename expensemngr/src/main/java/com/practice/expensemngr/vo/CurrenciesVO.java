package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

@Data
public class CurrenciesVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "code can not null")
    private String code;

    @NotNull(message = "name can not null")
    private String name;

    private String symbol;

    @NotNull(message = "decimalPlaces can not null")
    private Integer decimalPlaces;

}
