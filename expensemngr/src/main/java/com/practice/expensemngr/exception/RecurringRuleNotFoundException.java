package io.saadmughal.assignment05.exception;

/**
 * Exception thrown when recurring rule is not found
 */
public class RecurringRuleNotFoundException extends RuntimeException {

    public RecurringRuleNotFoundException(Long ruleId) {
        super("Recurring rule not found with ID: " + ruleId);
    }
}