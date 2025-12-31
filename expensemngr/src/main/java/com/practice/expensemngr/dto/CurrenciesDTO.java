package com.practice.expensemngr.dto;


import lombok.Data;

import java.io.Serializable;

@Data
public class CurrenciesDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String code;

    private String name;

    private String symbol;

    private Integer decimalPlaces;

}
