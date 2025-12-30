package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attachment is not found
 */
public class AttachmentNotFoundException extends RuntimeException {

    public AttachmentNotFoundException(Long attachmentId) {
        super("Attachment not found with ID: " + attachmentId);
    }
}