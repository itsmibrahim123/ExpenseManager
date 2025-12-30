package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.*;
import io.saadmughal.assignment05.exception.ExportException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.List;

/**
 * Service for generating CSV exports
 */
@Service
public class CsvExportService {

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd");
    private static final SimpleDateFormat DATETIME_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    /**
     * Export transactions to CSV
     * @param transactions List of transactions
     * @return CSV content as byte array
     */
    public byte[] exportTransactionsToCsv(List<TransactionExportDTO> transactions) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);

            // Define CSV format with headers
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(
                            "ID",
                            "Date",
                            "Type",
                            "Account",
                            "Category",
                            "Amount",
                            "Currency",
                            "Description",
                            "Reference Number",
                            "Status",
                            "Payment Method",
                            "Merchant",
                            "Tags",
                            "Created At"
                    )
                    .build();

            CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat);

            // Write data rows
            for (TransactionExportDTO transaction : transactions) {
                csvPrinter.printRecord(
                        transaction.getId(),
                        transaction.getTransactionDate() != null ?
                                DATE_FORMAT.format(transaction.getTransactionDate()) : "",
                        transaction.getType(),
                        transaction.getAccountName(),
                        transaction.getCategoryName(),
                        transaction.getAmount(),
                        transaction.getCurrencyCode(),
                        transaction.getDescription(),
                        transaction.getReferenceNumber(),
                        transaction.getStatus(),
                        transaction.getPaymentMethodName(),
                        transaction.getMerchantName(),
                        transaction.getTags(),
                        transaction.getCreatedAt() != null ?
                                DATETIME_FORMAT.format(transaction.getCreatedAt()) : ""
                );
            }

            csvPrinter.flush();
            csvPrinter.close();

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new ExportException("Failed to generate CSV for transactions", e);
        }
    }

    /**
     * Export accounts to CSV
     * @param accounts List of accounts
     * @return CSV content as byte array
     */
    public byte[] exportAccountsToCsv(List<AccountExportDTO> accounts) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);

            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(
                            "ID",
                            "Name",
                            "Type",
                            "Current Balance",
                            "Initial Balance",
                            "Currency",
                            "Archived",
                            "Created At",
                            "Updated At"
                    )
                    .build();

            CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat);

            for (AccountExportDTO account : accounts) {
                csvPrinter.printRecord(
                        account.getId(),
                        account.getName(),
                        account.getType(),
                        account.getCurrentBalance(),
                        account.getInitialBalance(),
                        account.getCurrencyCode(),
                        account.getArchived(),
                        account.getCreatedAt() != null ?
                                DATETIME_FORMAT.format(account.getCreatedAt()) : "",
                        account.getUpdatedAt() != null ?
                                DATETIME_FORMAT.format(account.getUpdatedAt()) : ""
                );
            }

            csvPrinter.flush();
            csvPrinter.close();

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new ExportException("Failed to generate CSV for accounts", e);
        }
    }

    /**
     * Export budgets to CSV (flattened with items)
     * @param budgets List of budgets
     * @return CSV content as byte array
     */
    public byte[] exportBudgetsToCsv(List<BudgetExportDTO> budgets) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);

            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(
                            "Budget ID",
                            "Budget Name",
                            "Period Type",
                            "Start Date",
                            "End Date",
                            "Total Limit",
                            "Notes",
                            "Category",
                            "Category Limit",
                            "Warning Percent",
                            "Created At"
                    )
                    .build();

            CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat);

            // Flatten budgets with their items
            for (BudgetExportDTO budget : budgets) {
                if (budget.getItems() != null && !budget.getItems().isEmpty()) {
                    // One row per budget item
                    for (BudgetItemExportDTO item : budget.getItems()) {
                        csvPrinter.printRecord(
                                budget.getId(),
                                budget.getName(),
                                budget.getPeriodType(),
                                budget.getStartDate() != null ?
                                        DATE_FORMAT.format(budget.getStartDate()) : "",
                                budget.getEndDate() != null ?
                                        DATE_FORMAT.format(budget.getEndDate()) : "",
                                budget.getTotalLimit(),
                                budget.getNotes(),
                                item.getCategoryName(),
                                item.getLimitAmount(),
                                item.getWarningPercent(),
                                budget.getCreatedAt() != null ?
                                        DATETIME_FORMAT.format(budget.getCreatedAt()) : ""
                        );
                    }
                } else {
                    // Budget without items
                    csvPrinter.printRecord(
                            budget.getId(),
                            budget.getName(),
                            budget.getPeriodType(),
                            budget.getStartDate() != null ?
                                    DATE_FORMAT.format(budget.getStartDate()) : "",
                            budget.getEndDate() != null ?
                                    DATE_FORMAT.format(budget.getEndDate()) : "",
                            budget.getTotalLimit(),
                            budget.getNotes(),
                            "",
                            "",
                            "",
                            budget.getCreatedAt() != null ?
                                    DATETIME_FORMAT.format(budget.getCreatedAt()) : ""
                    );
                }
            }

            csvPrinter.flush();
            csvPrinter.close();

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new ExportException("Failed to generate CSV for budgets", e);
        }
    }

    /**
     * Export categories to CSV
     * @param categories List of categories
     * @return CSV content as byte array
     */
    public byte[] exportCategoriesToCsv(List<CategoryExportDTO> categories) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);

            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(
                            "ID",
                            "Name",
                            "Type",
                            "Icon",
                            "Color",
                            "Sort Order",
                            "Archived",
                            "Parent Category",
                            "Created At",
                            "Updated At"
                    )
                    .build();

            CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat);

            for (CategoryExportDTO category : categories) {
                csvPrinter.printRecord(
                        category.getId(),
                        category.getName(),
                        category.getType(),
                        category.getIcon(),
                        category.getColor(),
                        category.getSortOrder(),
                        category.getArchived(),
                        category.getParentCategoryName(),
                        category.getCreatedAt() != null ?
                                DATETIME_FORMAT.format(category.getCreatedAt()) : "",
                        category.getUpdatedAt() != null ?
                                DATETIME_FORMAT.format(category.getUpdatedAt()) : ""
                );
            }

            csvPrinter.flush();
            csvPrinter.close();

            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new ExportException("Failed to generate CSV for categories", e);
        }
    }
}