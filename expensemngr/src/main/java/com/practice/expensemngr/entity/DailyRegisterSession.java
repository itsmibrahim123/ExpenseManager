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
@Table(name = "daily_register_sessions")
public class DailyRegisterSession implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "opened_at", nullable = false)
    private Date openedAt;

    @Column(name = "closed_at")
    private Date closedAt;

    @Column(name = "opening_cash_balance", nullable = false)
    private BigDecimal openingCashBalance;

    @Column(name = "expected_cash_balance")
    private BigDecimal expectedCashBalance;

    @Column(name = "actual_cash_balance")
    private BigDecimal actualCashBalance;

    @Column(name = "cash_difference")
    private BigDecimal cashDifference;

    @Column(name = "status", nullable = false)
    private String status; // OPEN, CLOSED

    @Column(name = "notes")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (this.openedAt == null) this.openedAt = new Date();
        if (this.status == null) this.status = "OPEN";
        if (this.openingCashBalance == null) this.openingCashBalance = BigDecimal.ZERO;
    }
}
