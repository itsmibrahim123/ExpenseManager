package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when export operation fails
 */
public class ExportException extends RuntimeException {

    public ExportException(String message) {
        super(message);
    }

    public ExportException(String message, Throwable cause) {
        super(message, cause);
    }
}