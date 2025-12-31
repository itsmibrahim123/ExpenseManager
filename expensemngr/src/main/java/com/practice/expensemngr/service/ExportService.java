package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.exception.NoDataToExportException;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Main export service - orchestrates data fetching and export generation
 */
@Service
public class ExportService {

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private BudgetsRepository budgetsRepository;

    @Autowired
    private BudgetItemsRepository budgetItemsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private TransactionTagsRepository transactionTagsRepository;

    @Autowired
    private TagsRepository tagsRepository;

    @Autowired
    private CsvExportService csvExportService;

    @Autowired
    private JsonExportService jsonExportService;

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    /**
     * Export transactions based on request
     * @param request Export request
     * @return Export file as byte array
     */
    public byte[] exportTransactions(ExportRequestDTO request) {
        // 1. Fetch transactions with filters
        List<Transactions> transactions = fetchTransactions(request);

        if (transactions.isEmpty()) {
            String dateRange = buildDateRangeString(request.getStartDate(), request.getEndDate());
            throw new NoDataToExportException("transactions", dateRange);
        }

        // 2. Convert to export DTOs
        List<TransactionExportDTO> exportDTOs = transactions.stream()
                .map(this::convertToTransactionExportDTO)
                .collect(Collectors.toList());

        // 3. Generate metadata
        ExportMetadataDTO metadata = buildMetadata(request, exportDTOs.size());

        // 4. Generate file based on format
        if ("CSV".equals(request.getFormat())) {
            return csvExportService.exportTransactionsToCsv(exportDTOs);
        } else if ("JSON".equals(request.getFormat())) {
            return jsonExportService.exportTransactionsToJson(exportDTOs, metadata);
        } else {
            throw new UnsupportedOperationException("Format not yet implemented: " + request.getFormat());
        }
    }

    /**
     * Export accounts based on request
     * @param request Export request
     * @return Export file as byte array
     */
    public byte[] exportAccounts(ExportRequestDTO request) {
        // 1. Fetch accounts for user
        List<Accounts> accounts = accountsRepository.findByUserId(request.getUserId());

        if (accounts.isEmpty()) {
            throw new NoDataToExportException("accounts");
        }

        // 2. Convert to export DTOs
        List<AccountExportDTO> exportDTOs = accounts.stream()
                .map(this::convertToAccountExportDTO)
                .collect(Collectors.toList());

        // 3. Generate metadata
        ExportMetadataDTO metadata = buildMetadata(request, exportDTOs.size());

        // 4. Generate file based on format
        if ("CSV".equals(request.getFormat())) {
            return csvExportService.exportAccountsToCsv(exportDTOs);
        } else if ("JSON".equals(request.getFormat())) {
            return jsonExportService.exportAccountsToJson(exportDTOs, metadata);
        } else {
            throw new UnsupportedOperationException("Format not yet implemented: " + request.getFormat());
        }
    }

    /**
     * Export budgets based on request
     * @param request Export request
     * @return Export file as byte array
     */
    public byte[] exportBudgets(ExportRequestDTO request) {
        // 1. Fetch budgets for user
        List<Budgets> budgets = budgetsRepository.findByUserId(request.getUserId());

        if (budgets.isEmpty()) {
            throw new NoDataToExportException("budgets");
        }

        // 2. Convert to export DTOs (includes items)
        List<BudgetExportDTO> exportDTOs = budgets.stream()
                .map(this::convertToBudgetExportDTO)
                .collect(Collectors.toList());

        // 3. Generate metadata
        ExportMetadataDTO metadata = buildMetadata(request, exportDTOs.size());

        // 4. Generate file based on format
        if ("CSV".equals(request.getFormat())) {
            return csvExportService.exportBudgetsToCsv(exportDTOs);
        } else if ("JSON".equals(request.getFormat())) {
            return jsonExportService.exportBudgetsToJson(exportDTOs, metadata);
        } else {
            throw new UnsupportedOperationException("Format not yet implemented: " + request.getFormat());
        }
    }

    /**
     * Export categories based on request
     * @param request Export request
     * @return Export file as byte array
     */
    public byte[] exportCategories(ExportRequestDTO request) {
        // 1. Fetch categories for user (including system categories)
        List<Categories> categories = categoriesRepository.findByUserIdOrUserIdIsNull(request.getUserId());

        if (categories.isEmpty()) {
            throw new NoDataToExportException("categories");
        }

        // 2. Convert to export DTOs
        List<CategoryExportDTO> exportDTOs = categories.stream()
                .map(this::convertToCategoryExportDTO)
                .collect(Collectors.toList());

        // 3. Generate metadata
        ExportMetadataDTO metadata = buildMetadata(request, exportDTOs.size());

        // 4. Generate file based on format
        if ("CSV".equals(request.getFormat())) {
            return csvExportService.exportCategoriesToCsv(exportDTOs);
        } else if ("JSON".equals(request.getFormat())) {
            return jsonExportService.exportCategoriesToJson(exportDTOs, metadata);
        } else {
            throw new UnsupportedOperationException("Format not yet implemented: " + request.getFormat());
        }
    }

    /**
     * Export all data (complete backup)
     * @param request Export request
     * @return Export file as byte array
     */
    public byte[] exportAllData(ExportRequestDTO request) {
        // Only JSON format supported for all data
        if (!"JSON".equals(request.getFormat())) {
            throw new UnsupportedOperationException("ALL data export only supports JSON format");
        }

        // 1. Fetch all data types
        List<Transactions> transactions = fetchTransactions(request);
        List<Accounts> accounts = accountsRepository.findByUserId(request.getUserId());
        List<Budgets> budgets = budgetsRepository.findByUserId(request.getUserId());
        List<Categories> categories = categoriesRepository.findByUserIdOrUserIdIsNull(request.getUserId());

        // 2. Convert to export DTOs
        List<TransactionExportDTO> transactionDTOs = transactions.stream()
                .map(this::convertToTransactionExportDTO)
                .collect(Collectors.toList());

        List<AccountExportDTO> accountDTOs = accounts.stream()
                .map(this::convertToAccountExportDTO)
                .collect(Collectors.toList());

        List<BudgetExportDTO> budgetDTOs = budgets.stream()
                .map(this::convertToBudgetExportDTO)
                .collect(Collectors.toList());

        List<CategoryExportDTO> categoryDTOs = categories.stream()
                .map(this::convertToCategoryExportDTO)
                .collect(Collectors.toList());

        // 3. Calculate total records
        int totalRecords = transactionDTOs.size() + accountDTOs.size() +
                budgetDTOs.size() + categoryDTOs.size();

        // 4. Generate metadata
        ExportMetadataDTO metadata = buildMetadata(request, totalRecords);

        // 5. Generate JSON
        return jsonExportService.exportAllDataToJson(
                transactionDTOs, accountDTOs, budgetDTOs, categoryDTOs, metadata);
    }

    /**
     * Fetch transactions with filters
     */
    private List<Transactions> fetchTransactions(ExportRequestDTO request) {
        // Start with user filter (required)
        Specification<Transactions> spec = (root, query, cb) ->
                cb.equal(root.get("userId"), request.getUserId());

        // Date range filter
        if (request.getStartDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("transactionDate"), request.getStartDate()));
        }
        if (request.getEndDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("transactionDate"), request.getEndDate()));
        }

        // Account filter
        if (request.getAccountId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("accountId"), request.getAccountId()));
        }

        // Category filter
        if (request.getCategoryId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("categoryId"), request.getCategoryId()));
        }

        // Type filter
        if (request.getType() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("type"), request.getType()));
        }

        // Status filter
        if (request.getStatus() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), request.getStatus()));
        }

        return transactionsRepository.findAll(spec);
    }

    /**
     * Convert Transaction entity to export DTO
     */
    private TransactionExportDTO convertToTransactionExportDTO(Transactions transaction) {
        // Fetch related entities
        String accountName = accountsRepository.findById(transaction.getAccountId())
                .map(Accounts::getName)
                .orElse("");

        String categoryName = categoriesRepository.findById(transaction.getCategoryId())
                .map(Categories::getName)
                .orElse("");

        String paymentMethodName = transaction.getPaymentMethodId() != null ?
                "" : ""; // Payment methods not fully implemented

        String merchantName = transaction.getMerchantId() != null ?
                "" : ""; // Merchants not fully implemented

        // Fetch tags
        String tags = transactionTagsRepository.findByTransactionId(transaction.getId()).stream()
                .map(tt -> tagsRepository.findById(tt.getTagId())
                        .map(Tags::getName)
                        .orElse(""))
                .filter(name -> !name.isEmpty())
                .collect(Collectors.joining(","));

        return TransactionExportDTO.builder()
                .id(transaction.getId())
                .transactionDate(transaction.getTransactionDate())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .description(transaction.getDescription())
                .referenceNumber(transaction.getReferenceNumber())
                .status(transaction.getStatus())
                .accountName(accountName)
                .categoryName(categoryName)
                .paymentMethodName(paymentMethodName)
                .merchantName(merchantName)
                .tags(tags)
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    /**
     * Convert Account entity to export DTO
     */
    private AccountExportDTO convertToAccountExportDTO(Accounts account) {
        return AccountExportDTO.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .currentBalance(account.getCurrentBalance())
                .initialBalance(account.getInitialBalance())
                .currencyCode(account.getCurrencyCode())
                .archived(account.getArchived())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }

    /**
     * Convert Budget entity to export DTO (includes items)
     */
    private BudgetExportDTO convertToBudgetExportDTO(Budgets budget) {
        // Fetch budget items
        List<BudgetItems> items = budgetItemsRepository.findByBudgetId(budget.getId());

        List<BudgetItemExportDTO> itemDTOs = items.stream()
                .map(item -> {
                    String categoryName = categoriesRepository.findById(item.getCategoryId())
                            .map(Categories::getName)
                            .orElse("");

                    return BudgetItemExportDTO.builder()
                            .categoryName(categoryName)
                            .limitAmount(item.getLimitAmount())
                            .warningPercent(item.getWarningPercent())
                            .build();
                })
                .collect(Collectors.toList());

        return BudgetExportDTO.builder()
                .id(budget.getId())
                .name(budget.getName())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .totalLimit(budget.getTotalLimit())
                .notes(budget.getNotes())
                .items(itemDTOs)
                .createdAt(budget.getCreatedAt())
                .build();
    }

    /**
     * Convert Category entity to export DTO
     */
    private CategoryExportDTO convertToCategoryExportDTO(Categories category) {
        String parentCategoryName = category.getParentCategoryId() != null ?
                categoriesRepository.findById(category.getParentCategoryId())
                        .map(Categories::getName)
                        .orElse("") : "";

        return CategoryExportDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .icon(category.getIcon())
                .color(category.getColor())
                .sortOrder(category.getSortOrder())
                .archived(category.getArchived())
                .parentCategoryName(parentCategoryName)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    /**
     * Build export metadata
     */
    private ExportMetadataDTO buildMetadata(ExportRequestDTO request, int recordCount) {
        String dateRange = buildDateRangeString(request.getStartDate(), request.getEndDate());
        String fileName = buildFileName(request);

        return ExportMetadataDTO.builder()
                .dataType(request.getDataType())
                .format(request.getFormat())
                .recordCount(recordCount)
                .dateRange(dateRange)
                .fileName(fileName)
                .generatedAt(new Date())
                .build();
    }

    /**
     * Build date range string
     */
    private String buildDateRangeString(Date startDate, Date endDate) {
        if (startDate != null && endDate != null) {
            return DATE_FORMAT.format(startDate) + " to " + DATE_FORMAT.format(endDate);
        } else if (startDate != null) {
            return "From " + DATE_FORMAT.format(startDate);
        } else if (endDate != null) {
            return "Until " + DATE_FORMAT.format(endDate);
        } else {
            return "All time";
        }
    }

    /**
     * Build file name
     */
    private String buildFileName(ExportRequestDTO request) {
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String dataType = request.getDataType().toLowerCase();
        String extension = request.getFormat().equalsIgnoreCase("CSV") ? ".csv" : ".json";

        return dataType + "_export_" + timestamp + extension;
    }
}