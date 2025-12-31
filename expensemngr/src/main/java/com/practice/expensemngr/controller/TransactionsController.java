package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.TransactionCreateRequestDTO;
import com.practice.expensemngr.dto.TransactionResponseDTO;
import com.practice.expensemngr.service.TransactionsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.practice.expensemngr.dto.TransferRequestDTO;
import com.practice.expensemngr.dto.TransferResponseDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/transactions")
public class TransactionsController {

    @Autowired
    private TransactionsService transactionsService;

    /**
     * Create a new transaction (expense or income)
     * @param request Transaction creation data
     * @param allowNegative Allow negative balance for expenses (default: false)
     * @return Created transaction details
     */
    @PostMapping
    public ResponseEntity<TransactionResponseDTO> createTransaction(
            @Valid @RequestBody TransactionCreateRequestDTO request,
            @RequestParam(defaultValue = "false") boolean allowNegative) {
        TransactionResponseDTO response = transactionsService.createTransaction(request, allowNegative);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all transactions for a user
     * @param userId User ID
     * @param accountId Optional account filter
     * @return List of transactions
     */
    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> getTransactions(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) Long accountId) {
        List<TransactionResponseDTO> transactions = transactionsService.getTransactionsByUser(userId, accountId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Get single transaction by ID
     * @param id Transaction ID
     * @return Transaction details
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> getTransactionById(@PathVariable @NotNull Long id) {
        TransactionResponseDTO transaction = transactionsService.getTransactionById(id);
        return ResponseEntity.ok(transaction);
    }

    /**
     * Update transaction status (PENDING → CLEARED)
     * @param id Transaction ID
     * @param status New status
     * @return Updated transaction details
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TransactionResponseDTO> updateTransactionStatus(
            @PathVariable @NotNull Long id,
            @RequestParam @NotNull String status) {
        TransactionResponseDTO transaction = transactionsService.updateTransactionStatus(id, status);
        return ResponseEntity.ok(transaction);
    }

    /**
     * Transfer funds between two accounts
     * @param request Transfer request data
     * @param allowNegative Allow negative balance in source account (default: false)
     * @return Transfer response with both transaction details
     */
    @PostMapping("/transfer")
    public ResponseEntity<TransferResponseDTO> transferFunds(
            @Valid @RequestBody TransferRequestDTO request,
            @RequestParam(defaultValue = "false") boolean allowNegative) {
        TransferResponseDTO response = transactionsService.transferFunds(request, allowNegative);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}