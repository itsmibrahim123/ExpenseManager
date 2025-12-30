package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.ExportRequestDTO;
import com.practice.expensemngr.service.ExportService;
import com.practice.expensemngr.util.ExportFormatEnum;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Controller for data export operations
 */
@RestController
@RequestMapping("/export")
public class ExportController {

    @Autowired
    private ExportService exportService;

    /**
     * Export transactions
     * @param request Export request with filters
     * @return File download response
     */
    @PostMapping("/transactions")
    public ResponseEntity<byte[]> exportTransactions(@Valid @RequestBody ExportRequestDTO request) {
        // Set data type
        request.setDataType("TRANSACTIONS");

        // Generate export
        byte[] fileContent = exportService.exportTransactions(request);

        // Build response headers
        HttpHeaders headers = buildResponseHeaders(request.getFormat(), "transactions");

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }

    /**
     * Export accounts
     * @param request Export request
     * @return File download response
     */
    @PostMapping("/accounts")
    public ResponseEntity<byte[]> exportAccounts(@Valid @RequestBody ExportRequestDTO request) {
        // Set data type
        request.setDataType("ACCOUNTS");

        // Generate export
        byte[] fileContent = exportService.exportAccounts(request);

        // Build response headers
        HttpHeaders headers = buildResponseHeaders(request.getFormat(), "accounts");

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }

    /**
     * Export budgets
     * @param request Export request
     * @return File download response
     */
    @PostMapping("/budgets")
    public ResponseEntity<byte[]> exportBudgets(@Valid @RequestBody ExportRequestDTO request) {
        // Set data type
        request.setDataType("BUDGETS");

        // Generate export
        byte[] fileContent = exportService.exportBudgets(request);

        // Build response headers
        HttpHeaders headers = buildResponseHeaders(request.getFormat(), "budgets");

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }

    /**
     * Export categories
     * @param request Export request
     * @return File download response
     */
    @PostMapping("/categories")
    public ResponseEntity<byte[]> exportCategories(@Valid @RequestBody ExportRequestDTO request) {
        // Set data type
        request.setDataType("CATEGORIES");

        // Generate export
        byte[] fileContent = exportService.exportCategories(request);

        // Build response headers
        HttpHeaders headers = buildResponseHeaders(request.getFormat(), "categories");

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }

    /**
     * Export all data (complete backup)
     * @param request Export request (JSON format only)
     * @return File download response
     */
    @PostMapping("/all")
    public ResponseEntity<byte[]> exportAllData(@Valid @RequestBody ExportRequestDTO request) {
        // Set data type
        request.setDataType("ALL");

        // Force JSON format for all data
        request.setFormat("JSON");

        // Generate export
        byte[] fileContent = exportService.exportAllData(request);

        // Build response headers
        HttpHeaders headers = buildResponseHeaders("JSON", "all_data");

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }

    /**
     * Build response headers for file download
     * @param format Export format
     * @param dataType Data type name
     * @return HTTP headers
     */
    private HttpHeaders buildResponseHeaders(String format, String dataType) {
        HttpHeaders headers = new HttpHeaders();

        // Get format enum
        ExportFormatEnum formatEnum;
        try {
            formatEnum = ExportFormatEnum.valueOf(format.toUpperCase());
        } catch (IllegalArgumentException e) {
            formatEnum = ExportFormatEnum.CSV; // Default to CSV
        }

        // Set content type
        headers.setContentType(MediaType.parseMediaType(formatEnum.getMimeType()));

        // Build filename with timestamp
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String filename = dataType + "_export_" + timestamp + formatEnum.getExtension();

        // Set content disposition
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition
                        .attachment()
                        .filename(filename)
                        .build()
        );

        // Set cache control
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.setPragma("no-cache");
        headers.setExpires(0);

        return headers;
    }
}