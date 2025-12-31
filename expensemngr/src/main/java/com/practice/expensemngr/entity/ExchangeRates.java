package com.practice.expensemngr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Getter
@Setter
@ToString
@SuperBuilder
@NoArgsConstructor
@Table(name = "exchange_rates")
public class ExchangeRates implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_code", nullable = false)
    private String fromCode;

    @Column(name = "to_code", nullable = false)
    private String toCode;

    @Column(name = "rate", nullable = false)
    private BigDecimal rate;

    @Column(name = "rate_date", nullable = false)
    private Date rateDate;

    @Column(name = "created_at", nullable = false)
    private Date createdAt;

}
