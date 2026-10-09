package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Transactional
    public InvoiceResponseDTO createInvoice(InvoiceCreateRequestDTO request) {
        String timeStamp = new SimpleDateFormat("yyyyMMdd-HHmmss").format(new Date());
        String invoiceNum = "INV-" + timeStamp + "-" + (100 + new Random().nextInt(900));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        List<InvoiceItem> invoiceItems = new ArrayList<>();

        for (InvoiceItemRequestDTO itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            if (product.getCurrentStock() < itemReq.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for product '" + product.getName() + 
                        "'. Available: " + product.getCurrentStock() + ", Requested: " + itemReq.getQuantity());
            }

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getSellingPrice();
            BigDecimal quantityBD = BigDecimal.valueOf(itemReq.getQuantity());
            BigDecimal itemSubtotal = unitPrice.multiply(quantityBD);

            BigDecimal taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() : BigDecimal.ZERO;
            BigDecimal itemTax = itemSubtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal discount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal lineTotal = itemSubtotal.add(itemTax).subtract(discount);

            subtotal = subtotal.add(itemSubtotal);
            taxTotal = taxTotal.add(itemTax);

            // Deduct Stock
            int newStock = product.getCurrentStock() - itemReq.getQuantity();
            product.setCurrentStock(newStock);
            productRepository.save(product);

            // Record Stock Movement
            StockMovement movement = StockMovement.builder()
                    .productId(product.getId())
                    .movementType("SALE_DEDUCT")
                    .quantityChanged(-itemReq.getQuantity())
                    .balanceAfter(newStock)
                    .referenceId(invoiceNum)
                    .notes("POS Checkout Deduction for Invoice " + invoiceNum)
                    .build();
            stockMovementRepository.save(movement);

            InvoiceItem item = InvoiceItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPrice(unitPrice)
                    .quantity(itemReq.getQuantity())
                    .taxRate(taxRate)
                    .discountAmount(discount)
                    .lineTotal(lineTotal)
                    .build();
            invoiceItems.add(item);
        }

        BigDecimal globalDiscount = request.getDiscountTotal() != null ? request.getDiscountTotal() : BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal.add(taxTotal).subtract(globalDiscount);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }

        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : grandTotal;
        BigDecimal balanceDue = grandTotal.subtract(paidAmount);
        if (balanceDue.compareTo(BigDecimal.ZERO) < 0) {
            balanceDue = BigDecimal.ZERO;
        }

        String paymentStatus = "PAID";
        if (paidAmount.compareTo(BigDecimal.ZERO) == 0 && grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = "UNPAID";
        } else if (balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = "PARTIALLY_PAID";
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNum)
                .customerId(request.getCustomerId())
                .userId(request.getUserId())
                .invoiceDate(new Date())
                .subtotal(subtotal)
                .taxTotal(taxTotal)
                .discountTotal(globalDiscount)
                .grandTotal(grandTotal)
                .paidAmount(paidAmount)
                .balanceDue(balanceDue)
                .paymentStatus(paymentStatus)
                .paymentMethod(request.getPaymentMethod())
                .accountId(request.getAccountId())
                .build();

        invoice = invoiceRepository.save(invoice);

        // Associate items with saved invoice
        for (InvoiceItem item : invoiceItems) {
            item.setInvoiceId(invoice.getId());
            item.setInvoice(invoice);
            invoiceItemRepository.save(item);
        }
        invoice.setItems(invoiceItems);

        // Update Customer Credit Balance if balance due
        if (request.getCustomerId() != null && balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            customerRepository.findById(request.getCustomerId()).ifPresent(customer -> {
                customer.setCurrentCreditBalance(customer.getCurrentCreditBalance().add(balanceDue));
                customerRepository.save(customer);
            });
        }

        // Ledger Entry: Income Transaction for Paid Amount
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            Long targetAccountId = request.getAccountId();
            if (targetAccountId == null) {
                // Pick first account for user
                List<Accounts> userAccounts = accountsRepository.findByUserIdAndIsArchivedFalse(request.getUserId());
                if (!userAccounts.isEmpty()) {
                    targetAccountId = userAccounts.get(0).getId();
                }
            }

            if (targetAccountId != null) {
                Long finalTargetAccountId = targetAccountId;
                accountsRepository.findById(targetAccountId).ifPresent(account -> {
                    Transactions incomeTx = Transactions.builder()
                            .userId(request.getUserId())
                            .accountId(finalTargetAccountId)
                            .categoryId(request.getCategoryId() != null ? request.getCategoryId() : 1L)
                            .type("INCOME")
                            .amount(paidAmount)
                            .currencyCode(account.getCurrency())
                            .transactionDate(new Date())
                            .status("COMPLETED")
                            .description("POS Invoice Income (" + request.getPaymentMethod() + "): " + invoiceNum)
                            .referenceNumber(invoiceNum)
                            .recurringInstance(false)
                            .createdAt(new Date())
                            .updatedAt(new Date())
                            .build();

                    transactionsRepository.save(incomeTx);

                    // Add to account balance
                    account.setCurrentBalance(account.getCurrentBalance().add(paidAmount));
                    accountsRepository.save(account);
                });
            }
        }

        return mapToDTO(invoice);
    }

    public List<InvoiceResponseDTO> getAllInvoices(String status, Date startDate, Date endDate) {
        List<Invoice> invoices;
        if (startDate != null && endDate != null) {
            invoices = invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(startDate, endDate);
        } else if (status != null && !status.isEmpty()) {
            invoices = invoiceRepository.findByPaymentStatus(status);
        } else {
            invoices = invoiceRepository.findAll();
            invoices.sort((a, b) -> b.getInvoiceDate().compareTo(a.getInvoiceDate()));
        }
        return invoices.stream().map(this::mapToDTO).toList();
    }

    public InvoiceResponseDTO getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        return mapToDTO(invoice);
    }

    public InvoiceResponseDTO getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceNumber));
        return mapToDTO(invoice);
    }

    private InvoiceResponseDTO mapToDTO(Invoice invoice) {
        Customer customer = null;
        if (invoice.getCustomerId() != null) {
            customer = customerRepository.findById(invoice.getCustomerId()).orElse(null);
        }

        List<InvoiceItemResponseDTO> itemDTOs = new ArrayList<>();
        if (invoice.getItems() != null) {
            itemDTOs = invoice.getItems().stream().map(item -> InvoiceItemResponseDTO.builder()
                    .id(item.getId())
                    .invoiceId(item.getInvoiceId())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .unitPrice(item.getUnitPrice())
                    .quantity(item.getQuantity())
                    .taxRate(item.getTaxRate())
                    .discountAmount(item.getDiscountAmount())
                    .lineTotal(item.getLineTotal())
                    .build()).toList();
        }

        return InvoiceResponseDTO.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .customerId(invoice.getCustomerId())
                .customerName(customer != null ? customer.getName() : "Walk-in Customer")
                .customerPhone(customer != null ? customer.getPhone() : null)
                .userId(invoice.getUserId())
                .invoiceDate(invoice.getInvoiceDate())
                .subtotal(invoice.getSubtotal())
                .taxTotal(invoice.getTaxTotal())
                .discountTotal(invoice.getDiscountTotal())
                .grandTotal(invoice.getGrandTotal())
                .paidAmount(invoice.getPaidAmount())
                .balanceDue(invoice.getBalanceDue())
                .paymentStatus(invoice.getPaymentStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .accountId(invoice.getAccountId())
                .items(itemDTOs)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
