package com.practice.expensemngr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@ToString
@SuperBuilder
@NoArgsConstructor
@Table(name = "invoices")
public class Invoice implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "customer_id")
    private Long customerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "invoice_date", nullable = false)
    private Date invoiceDate;

    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;

    @Column(name = "tax_total", nullable = false)
    private BigDecimal taxTotal;

    @Column(name = "discount_total", nullable = false)
    private BigDecimal discountTotal;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal;

    @Column(name = "paid_amount", nullable = false)
    private BigDecimal paidAmount;

    @Column(name = "balance_due", nullable = false)
    private BigDecimal balanceDue;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus; // PAID, PARTIALLY_PAID, UNPAID, REFUNDED

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // CASH, CARD, TRANSFER, CUSTOMER_CREDIT

    @Column(name = "account_id")
    private Long accountId;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        if (this.invoiceDate == null) this.invoiceDate = new Date();
        if (this.subtotal == null) this.subtotal = BigDecimal.ZERO;
        if (this.taxTotal == null) this.taxTotal = BigDecimal.ZERO;
        if (this.discountTotal == null) this.discountTotal = BigDecimal.ZERO;
        if (this.grandTotal == null) this.grandTotal = BigDecimal.ZERO;
        if (this.paidAmount == null) this.paidAmount = BigDecimal.ZERO;
        if (this.balanceDue == null) this.balanceDue = BigDecimal.ZERO;
        if (this.paymentStatus == null) this.paymentStatus = "PAID";
        if (this.paymentMethod == null) this.paymentMethod = "CASH";
    }
}
