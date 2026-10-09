package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.CloseRegisterDTO;
import com.practice.expensemngr.dto.DailySummaryDTO;
import com.practice.expensemngr.dto.OpenRegisterDTO;
import com.practice.expensemngr.dto.RegisterSessionResponseDTO;
import com.practice.expensemngr.entity.DailyRegisterSession;
import com.practice.expensemngr.entity.Invoice;
import com.practice.expensemngr.entity.Transactions;
import com.practice.expensemngr.repository.DailyRegisterSessionRepository;
import com.practice.expensemngr.repository.InvoiceRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class DailyRegisterService {

    @Autowired
    private DailyRegisterSessionRepository sessionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Transactional
    public RegisterSessionResponseDTO openSession(OpenRegisterDTO request) {
        Optional<DailyRegisterSession> activeSession = sessionRepository
                .findFirstByUserIdAndStatusOrderByOpenedAtDesc(request.getUserId(), "OPEN");

        if (activeSession.isPresent()) {
            throw new IllegalStateException("An active register session is already open for user ID: " + request.getUserId());
        }

        DailyRegisterSession session = DailyRegisterSession.builder()
                .userId(request.getUserId())
                .openedAt(new Date())
                .openingCashBalance(request.getOpeningCashBalance())
                .status("OPEN")
                .notes(request.getNotes())
                .build();

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    @Transactional
    public RegisterSessionResponseDTO closeSession(Long sessionId, CloseRegisterDTO request) {
        DailyRegisterSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Register session not found: " + sessionId));

        if ("CLOSED".equalsIgnoreCase(session.getStatus())) {
            throw new IllegalStateException("Register session is already closed.");
        }

        Date startTime = session.getOpenedAt();
        Date endTime = new Date();

        // Calculate Cash Sales during session
        List<Invoice> invoices = invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(startTime, endTime);
        BigDecimal cashSales = invoices.stream()
                .filter(inv -> "CASH".equalsIgnoreCase(inv.getPaymentMethod()))
                .map(Invoice::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate Cash Expenses during session
        List<Transactions> userTransactions = transactionsRepository.findByUserId(session.getUserId());
        BigDecimal cashExpenses = userTransactions.stream()
                .filter(tx -> "EXPENSE".equalsIgnoreCase(tx.getType()))
                .filter(tx -> tx.getTransactionDate() != null && 
                              !tx.getTransactionDate().before(startTime) && 
                              !tx.getTransactionDate().after(endTime))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expectedCash = session.getOpeningCashBalance().add(cashSales).subtract(cashExpenses);
        BigDecimal variance = request.getActualCashBalance().subtract(expectedCash);

        session.setClosedAt(endTime);
        session.setExpectedCashBalance(expectedCash);
        session.setActualCashBalance(request.getActualCashBalance());
        session.setCashDifference(variance);
        session.setStatus("CLOSED");
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            session.setNotes((session.getNotes() != null ? session.getNotes() + " | " : "") + request.getNotes());
        }

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    public RegisterSessionResponseDTO getCurrentSession(Long userId) {
        Optional<DailyRegisterSession> activeSession = sessionRepository
                .findFirstByUserIdAndStatusOrderByOpenedAtDesc(userId, "OPEN");

        return activeSession.map(this::mapToDTO).orElse(null);
    }

    public DailySummaryDTO getDailySummary(Date date, Long userId) {
        Calendar cal = Calendar.getInstance();
        if (date != null) {
            cal.setTime(date);
        }
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date startOfDay = cal.getTime();

        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        cal.set(Calendar.MILLISECOND, 999);
        Date endOfDay = cal.getTime();

        // Get session for that day
        List<DailyRegisterSession> sessions = sessionRepository.findSessionsForDateRange(startOfDay, endOfDay);
        DailyRegisterSession session = sessions.isEmpty() ? null : sessions.get(0);

        // Fetch Invoices for date
        List<Invoice> invoices = invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(startOfDay, endOfDay);

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;
        BigDecimal transferSales = BigDecimal.ZERO;
        BigDecimal creditSales = BigDecimal.ZERO;

        Map<String, BigDecimal> salesByMethod = new HashMap<>();

        for (Invoice inv : invoices) {
            BigDecimal amt = inv.getPaidAmount();
            totalSales = totalSales.add(amt);
            String method = inv.getPaymentMethod() != null ? inv.getPaymentMethod().toUpperCase() : "CASH";

            salesByMethod.put(method, salesByMethod.getOrDefault(method, BigDecimal.ZERO).add(amt));

            switch (method) {
                case "CASH" -> cashSales = cashSales.add(amt);
                case "CARD" -> cardSales = cardSales.add(amt);
                case "TRANSFER" -> transferSales = transferSales.add(amt);
                case "CUSTOMER_CREDIT" -> creditSales = creditSales.add(amt);
                default -> cashSales = cashSales.add(amt);
            }
        }

        // Fetch Expenses for date
        List<Transactions> userTransactions = userId != null ? transactionsRepository.findByUserId(userId) : transactionsRepository.findAll();
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal cashExpenses = BigDecimal.ZERO;

        for (Transactions tx : userTransactions) {
            if ("EXPENSE".equalsIgnoreCase(tx.getType()) && tx.getTransactionDate() != null) {
                if (!tx.getTransactionDate().before(startOfDay) && !tx.getTransactionDate().after(endOfDay)) {
                    totalExpenses = totalExpenses.add(tx.getAmount());
                    // Assume expense is cash unless specified
                    cashExpenses = cashExpenses.add(tx.getAmount());
                }
            }
        }

        BigDecimal openingFloat = session != null ? session.getOpeningCashBalance() : BigDecimal.ZERO;
        BigDecimal netCashInflow = cashSales.subtract(cashExpenses);
        BigDecimal expectedCash = openingFloat.add(netCashInflow);
        BigDecimal actualCash = session != null && session.getActualCashBalance() != null ? session.getActualCashBalance() : expectedCash;
        BigDecimal variance = session != null && session.getCashDifference() != null ? session.getCashDifference() : BigDecimal.ZERO;

        return DailySummaryDTO.builder()
                .date(startOfDay)
                .sessionId(session != null ? session.getId() : null)
                .sessionStatus(session != null ? session.getStatus() : "NO_SESSION")
                .sessionOpenedAt(session != null ? session.getOpenedAt() : null)
                .sessionClosedAt(session != null ? session.getClosedAt() : null)
                .openingCashFloat(openingFloat)
                .totalSales(totalSales)
                .cashSales(cashSales)
                .cardSales(cardSales)
                .transferSales(transferSales)
                .creditSales(creditSales)
                .salesByPaymentMethod(salesByMethod)
                .totalInvoicesCount(invoices.size())
                .totalExpenses(totalExpenses)
                .cashExpenses(cashExpenses)
                .netCashInflow(netCashInflow)
                .expectedCashInDrawer(expectedCash)
                .actualCashInDrawer(actualCash)
                .cashVariance(variance)
                .build();
    }

    private RegisterSessionResponseDTO mapToDTO(DailyRegisterSession session) {
        return RegisterSessionResponseDTO.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .openedAt(session.getOpenedAt())
                .closedAt(session.getClosedAt())
                .openingCashBalance(session.getOpeningCashBalance())
                .expectedCashBalance(session.getExpectedCashBalance())
                .actualCashBalance(session.getActualCashBalance())
                .cashDifference(session.getCashDifference())
                .status(session.getStatus())
                .notes(session.getNotes())
                .build();
    }
}
