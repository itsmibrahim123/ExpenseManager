package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when attempting to create duplicate tag
 */
public class TagAlreadyExistsException extends RuntimeException {

    public TagAlreadyExistsException(String tagName) {
        super("Tag already exists with name: " + tagName);
    }
}