package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.exception.InvalidAmountRangeException;
import com.practice.expensemngr.exception.InvalidDateRangeException;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionSearchService {

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private TransactionTagsRepository transactionTagsRepository;

    @Autowired
    private TagsRepository tagsRepository;

    /**
     * Search and filter transactions with pagination
     * @param filter Filter criteria
     * @return Paginated search results
     */
    public TransactionSearchResponseDTO searchTransactions(TransactionFilterDTO filter) {
        // 1. Validate filter criteria
        validateFilters(filter);

        // 2. Set defaults
        if (filter.getPage() == null || filter.getPage() < 0) {
            filter.setPage(0);
        }
        if (filter.getSize() == null || filter.getSize() <= 0) {
            filter.setSize(20);
        }

        // 3. Get all user transactions
        List<Transactions> allTransactions = transactionsRepository.findAll().stream()
                .filter(t -> t.getUserId().equals(filter.getUserId()))
                .collect(Collectors.toList());

        // 4. Apply filters
        List<Transactions> filteredTransactions = applyFilters(allTransactions, filter);

        // 5. Sort by date descending (newest first), then by created date
        filteredTransactions.sort(Comparator
                .comparing(Transactions::getTransactionDate).reversed()
                .thenComparing(Comparator.comparing(Transactions::getCreatedAt).reversed()));

        // 6. Calculate pagination
        int totalElements = filteredTransactions.size();
        int totalPages = (int) Math.ceil((double) totalElements / filter.getSize());
        int startIndex = filter.getPage() * filter.getSize();
        int endIndex = Math.min(startIndex + filter.getSize(), totalElements);

        // 7. Get page subset
        List<Transactions> pageTransactions = filteredTransactions.subList(
                Math.min(startIndex, totalElements),
                Math.min(endIndex, totalElements)
        );

        // 8. Convert to DTOs
        List<TransactionSearchItemDTO> transactionDTOs = pageTransactions.stream()
                .map(this::toSearchItemDTO)
                .collect(Collectors.toList());

        // 9. Build and return response
        return TransactionSearchResponseDTO.builder()
                .transactions(transactionDTOs)
                .totalElements((long) totalElements)
                .totalPages(totalPages)
                .currentPage(filter.getPage())
                .pageSize(filter.getSize())
                .appliedFilters(filter)
                .build();
    }

    /**
     * Validate filter criteria
     */
    private void validateFilters(TransactionFilterDTO filter) {
        // Validate date range
        if (filter.getStartDate() != null && filter.getEndDate() != null) {
            if (filter.getEndDate().before(filter.getStartDate())) {
                throw new InvalidDateRangeException();
            }
        }

        // Validate amount range
        if (filter.getMinAmount() != null && filter.getMaxAmount() != null) {
            if (filter.getMaxAmount().compareTo(filter.getMinAmount()) < 0) {
                throw new InvalidAmountRangeException();
            }
        }
    }

    /**
     * Apply all filters to transaction list
     */
    private List<Transactions> applyFilters(List<Transactions> transactions, TransactionFilterDTO filter) {
        return transactions.stream()
                .filter(t -> applyDateFilter(t, filter))
                .filter(t -> applyAccountFilter(t, filter))
                .filter(t -> applyCategoryFilter(t, filter))
                .filter(t -> applyTypeFilter(t, filter))
                .filter(t -> applyAmountFilter(t, filter))
                .filter(t -> applyKeywordFilter(t, filter))
                .filter(t -> applyStatusFilter(t, filter))
                .filter(t -> applyTagFilter(t, filter))
                .collect(Collectors.toList());
    }

    /**
     * Filter by date range
     */
    private boolean applyDateFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getStartDate() != null && transaction.getTransactionDate().before(filter.getStartDate())) {
            return false;
        }
        if (filter.getEndDate() != null && transaction.getTransactionDate().after(filter.getEndDate())) {
            return false;
        }
        return true;
    }

    /**
     * Filter by account
     */
    private boolean applyAccountFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getAccountId() == null) {
            return true;
        }
        return transaction.getAccountId().equals(filter.getAccountId());
    }

    /**
     * Filter by category
     */
    private boolean applyCategoryFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getCategoryId() == null) {
            return true;
        }
        return transaction.getCategoryId().equals(filter.getCategoryId());
    }

    /**
     * Filter by transaction type
     */
    private boolean applyTypeFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getType() == null || filter.getType().isEmpty()) {
            return true;
        }
        return transaction.getType().equalsIgnoreCase(filter.getType());
    }

    /**
     * Filter by amount range
     */
    private boolean applyAmountFilter(Transactions transaction, TransactionFilterDTO filter) {
        BigDecimal amount = transaction.getAmount();

        if (filter.getMinAmount() != null && amount.compareTo(filter.getMinAmount()) < 0) {
            return false;
        }
        if (filter.getMaxAmount() != null && amount.compareTo(filter.getMaxAmount()) > 0) {
            return false;
        }
        return true;
    }

    /**
     * Filter by keyword (searches description and reference number)
     */
    private boolean applyKeywordFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getKeyword() == null || filter.getKeyword().isEmpty()) {
            return true;
        }

        String keyword = filter.getKeyword().toLowerCase();

        // Search in description
        if (transaction.getDescription() != null &&
                transaction.getDescription().toLowerCase().contains(keyword)) {
            return true;
        }

        // Search in reference number
        if (transaction.getReferenceNumber() != null &&
                transaction.getReferenceNumber().toLowerCase().contains(keyword)) {
            return true;
        }

        return false;
    }

    /**
     * Filter by status
     */
    private boolean applyStatusFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getStatus() == null || filter.getStatus().isEmpty()) {
            return true;
        }
        return transaction.getStatus().equalsIgnoreCase(filter.getStatus());
    }

    /**
     * Filter by tag
     */
    private boolean applyTagFilter(Transactions transaction, TransactionFilterDTO filter) {
        if (filter.getTagId() == null) {
            return true;
        }

        // Check if transaction has this tag
        return transactionTagsRepository.existsByTransactionIdAndTagId(
                transaction.getId(),
                filter.getTagId()
        );
    }

    /**
     * Convert transaction entity to search item DTO
     */
    private TransactionSearchItemDTO toSearchItemDTO(Transactions transaction) {
        // Get account name
        String accountName = accountsRepository.findById(transaction.getAccountId())
                .map(Accounts::getName)
                .orElse(null);

        // Get category name
        String categoryName = categoriesRepository.findById(transaction.getCategoryId())
                .map(Categories::getName)
                .orElse(null);

        // Get tags for this transaction
        List<TagDTO> tags = getTagsForTransaction(transaction.getId());

        return TransactionSearchItemDTO.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .description(transaction.getDescription())
                .referenceNumber(transaction.getReferenceNumber())
                .transactionDate(transaction.getTransactionDate())
                .status(transaction.getStatus())
                .accountId(transaction.getAccountId())
                .accountName(accountName)
                .categoryId(transaction.getCategoryId())
                .categoryName(categoryName)
                .tags(tags)
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    /**
     * Get tags for a transaction
     */
    private List<TagDTO> getTagsForTransaction(Long transactionId) {
        List<TransactionTags> transactionTags = transactionTagsRepository.findByTransactionId(transactionId);

        return transactionTags.stream()
                .map(tt -> tagsRepository.findById(tt.getTagId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(tag -> TagDTO.builder()
                        .id(tag.getId())
                        .userId(tag.getUserId())
                        .name(tag.getName())
                        .color(tag.getColor())
                        .createdAt(tag.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}