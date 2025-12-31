package com.practice.expensemngr.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.exception.ExportException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for generating JSON exports
 */
@Service
public class JsonExportService {

    private final ObjectMapper objectMapper;

    public JsonExportService() {
        this.objectMapper = new ObjectMapper();
        // Enable pretty printing
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        // Include dates in ISO format
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Export transactions to JSON
     * @param transactions List of transactions
     * @param metadata Export metadata
     * @return JSON content as byte array
     */
    public byte[] exportTransactionsToJson(List<TransactionExportDTO> transactions,
                                           ExportMetadataDTO metadata) {
        try {
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("metadata", metadata);
            exportData.put("dataType", "TRANSACTIONS");
            exportData.put("exportDate", new Date());
            exportData.put("recordCount", transactions.size());
            exportData.put("data", transactions);

            String json = objectMapper.writeValueAsString(exportData);
            return json.getBytes(StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new ExportException("Failed to generate JSON for transactions", e);
        }
    }

    /**
     * Export accounts to JSON
     * @param accounts List of accounts
     * @param metadata Export metadata
     * @return JSON content as byte array
     */
    public byte[] exportAccountsToJson(List<AccountExportDTO> accounts,
                                       ExportMetadataDTO metadata) {
        try {
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("metadata", metadata);
            exportData.put("dataType", "ACCOUNTS");
            exportData.put("exportDate", new Date());
            exportData.put("recordCount", accounts.size());
            exportData.put("data", accounts);

            String json = objectMapper.writeValueAsString(exportData);
            return json.getBytes(StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new ExportException("Failed to generate JSON for accounts", e);
        }
    }

    /**
     * Export budgets to JSON (nested structure with items)
     * @param budgets List of budgets
     * @param metadata Export metadata
     * @return JSON content as byte array
     */
    public byte[] exportBudgetsToJson(List<BudgetExportDTO> budgets,
                                      ExportMetadataDTO metadata) {
        try {
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("metadata", metadata);
            exportData.put("dataType", "BUDGETS");
            exportData.put("exportDate", new Date());
            exportData.put("recordCount", budgets.size());
            exportData.put("data", budgets);

            String json = objectMapper.writeValueAsString(exportData);
            return json.getBytes(StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new ExportException("Failed to generate JSON for budgets", e);
        }
    }

    /**
     * Export categories to JSON
     * @param categories List of categories
     * @param metadata Export metadata
     * @return JSON content as byte array
     */
    public byte[] exportCategoriesToJson(List<CategoryExportDTO> categories,
                                         ExportMetadataDTO metadata) {
        try {
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("metadata", metadata);
            exportData.put("dataType", "CATEGORIES");
            exportData.put("exportDate", new Date());
            exportData.put("recordCount", categories.size());
            exportData.put("data", categories);

            String json = objectMapper.writeValueAsString(exportData);
            return json.getBytes(StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new ExportException("Failed to generate JSON for categories", e);
        }
    }

    /**
     * Export all data to JSON (complete backup)
     * @param transactions List of transactions
     * @param accounts List of accounts
     * @param budgets List of budgets
     * @param categories List of categories
     * @param metadata Export metadata
     * @return JSON content as byte array
     */
    public byte[] exportAllDataToJson(List<TransactionExportDTO> transactions,
                                      List<AccountExportDTO> accounts,
                                      List<BudgetExportDTO> budgets,
                                      List<CategoryExportDTO> categories,
                                      ExportMetadataDTO metadata) {
        try {
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("metadata", metadata);
            exportData.put("dataType", "ALL");
            exportData.put("exportDate", new Date());

            // Add counts
            Map<String, Integer> counts = new HashMap<>();
            counts.put("transactions", transactions.size());
            counts.put("accounts", accounts.size());
            counts.put("budgets", budgets.size());
            counts.put("categories", categories.size());
            exportData.put("recordCounts", counts);

            // Add data
            Map<String, Object> data = new HashMap<>();
            data.put("transactions", transactions);
            data.put("accounts", accounts);
            data.put("budgets", budgets);
            data.put("categories", categories);
            exportData.put("data", data);

            String json = objectMapper.writeValueAsString(exportData);
            return json.getBytes(StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new ExportException("Failed to generate JSON for all data", e);
        }
    }
}