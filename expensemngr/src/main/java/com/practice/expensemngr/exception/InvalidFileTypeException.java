package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when file type is not allowed
 */
public class InvalidFileTypeException extends RuntimeException {

    public InvalidFileTypeException(String fileType) {
        super("File type not allowed: " + fileType + ". Allowed types: JPG, PNG, PDF");
    }
}