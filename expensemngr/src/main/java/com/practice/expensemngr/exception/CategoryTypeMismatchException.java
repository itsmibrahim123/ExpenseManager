package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when category type doesn't match transaction type
 */
public class CategoryTypeMismatchException extends RuntimeException {

    public CategoryTypeMismatchException(String transactionType, String categoryType) {
        super("Category type '" + categoryType + "' does not match transaction type '" + transactionType + "'");
    }
}