package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when tag is not found
 */
public class TagNotFoundException extends RuntimeException {

    public TagNotFoundException(Long tagId) {
        super("Tag not found with ID: " + tagId);
    }
}