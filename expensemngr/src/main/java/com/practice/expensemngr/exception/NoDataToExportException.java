package com.practice.expensemngr.exception;

/**
 * Exception thrown when there is no data to export
 */
public class NoDataToExportException extends RuntimeException {

    public NoDataToExportException(String dataType) {
        super("No data to export for: " + dataType);
    }

    public NoDataToExportException(String dataType, String dateRange) {
        super("No data to export for " + dataType + " in date range: " + dateRange);
    }
}