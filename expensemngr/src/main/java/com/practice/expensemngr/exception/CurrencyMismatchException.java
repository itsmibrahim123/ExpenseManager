package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attempting cross-currency transfer
 */
public class CurrencyMismatchException extends RuntimeException {

    public CurrencyMismatchException(String sourceCurrency, String destCurrency) {
        super("Cross-currency transfers not supported. Source currency: " + sourceCurrency + ", Destination currency: " + destCurrency);
    }
}