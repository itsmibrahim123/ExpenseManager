package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByInvoiceDateBetweenOrderByInvoiceDateDesc(Date startDate, Date endDate);

    List<Invoice> findByCustomerIdOrderByInvoiceDateDesc(Long customerId);

    List<Invoice> findByPaymentStatus(String paymentStatus);

    @Query("SELECT i FROM Invoice i WHERE i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    List<Invoice> findInvoicesForDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    long countInvoicesForDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
}
