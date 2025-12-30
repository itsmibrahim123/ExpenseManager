package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.TransactionFilterDTO;
import com.practice.expensemngr.dto.TransactionSearchResponseDTO;
import com.practice.expensemngr.service.TransactionSearchService;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Date;

@RestController
@RequestMapping("/transactions")
public class TransactionSearchController {

    @Autowired
    private TransactionSearchService transactionSearchService;

    /**
     * Search and filter transactions with pagination
     * @param userId User ID (required)
     * @param startDate Start date (optional)
     * @param endDate End date (optional)
     * @param accountId Filter by account (optional)
     * @param categoryId Filter by category (optional)
     * @param type Filter by type: EXPENSE, INCOME, TRANSFER (optional)
     * @param minAmount Minimum amount (optional)
     * @param maxAmount Maximum amount (optional)
     * @param keyword Text search in description and reference (optional)
     * @param tagId Filter by tag (optional)
     * @param status Filter by status: CLEARED, PENDING (optional)
     * @param page Page number (optional, default 0)
     * @param size Page size (optional, default 20)
     * @return Paginated search results
     */
    @GetMapping("/search")
    public ResponseEntity<TransactionSearchResponseDTO> searchTransactions(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        // Build filter DTO
        TransactionFilterDTO filter = TransactionFilterDTO.builder()
                .userId(userId)
                .startDate(startDate)
                .endDate(endDate)
                .accountId(accountId)
                .categoryId(categoryId)
                .type(type)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .keyword(keyword)
                .tagId(tagId)
                .status(status)
                .page(page)
                .size(size)
                .build();

        TransactionSearchResponseDTO results = transactionSearchService.searchTransactions(filter);
        return ResponseEntity.ok(results);
    }
}