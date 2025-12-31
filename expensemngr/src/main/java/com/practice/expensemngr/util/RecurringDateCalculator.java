package com.practice.expensemngr.util;

import java.util.Calendar;
import java.util.Date;

/**
 * Utility class for calculating next run dates for recurring rules
 */
public class RecurringDateCalculator {

    /**
     * Calculate the initial next run date based on start date and frequency
     * @param startDate Start date of the recurring rule
     * @param frequency Frequency type (DAILY, WEEKLY, MONTHLY, YEARLY)
     * @param intervalVal Interval value (e.g., every 2 weeks)
     * @param dayOfMonth Day of month (for MONTHLY, 1-31)
     * @param dayOfWeek Day of week (for WEEKLY, SUNDAY-SATURDAY)
     * @return Next run date
     */
    public static Date calculateInitialNextRunDate(Date startDate, String frequency,
                                                   Integer intervalVal, Integer dayOfMonth,
                                                   String dayOfWeek) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(startDate);

        switch (frequency) {
            case "DAILY":
                // For daily, next run is start date + interval days
                cal.add(Calendar.DAY_OF_MONTH, intervalVal);
                break;

            case "WEEKLY":
                // For weekly, find next occurrence of specified day of week
                int targetDayOfWeek = convertDayOfWeekToCalendar(dayOfWeek);
                int currentDayOfWeek = cal.get(Calendar.DAY_OF_WEEK);

                // Calculate days until target day
                int daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
                if (daysToAdd == 0) {
                    daysToAdd = 7 * intervalVal; // Already on target day, move to next occurrence
                } else {
                    cal.add(Calendar.DAY_OF_MONTH, daysToAdd);
                }
                break;

            case "MONTHLY":
                // For monthly, set to specified day of month in next interval
                cal.add(Calendar.MONTH, intervalVal);

                // Set to specified day of month, handling month-end edge cases
                int maxDayInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
                int targetDay = Math.min(dayOfMonth, maxDayInMonth);
                cal.set(Calendar.DAY_OF_MONTH, targetDay);
                break;

            case "YEARLY":
                // For yearly, same date next year(s)
                cal.add(Calendar.YEAR, intervalVal);
                break;
        }

        return cal.getTime();
    }

    /**
     * Calculate the next run date after the current one
     * @param currentNextRunDate Current next run date
     * @param frequency Frequency type
     * @param intervalVal Interval value
     * @param dayOfMonth Day of month (for MONTHLY)
     * @param dayOfWeek Day of week (for WEEKLY)
     * @return Next run date
     */
    public static Date calculateNextRunDate(Date currentNextRunDate, String frequency,
                                            Integer intervalVal, Integer dayOfMonth,
                                            String dayOfWeek) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(currentNextRunDate);

        switch (frequency) {
            case "DAILY":
                cal.add(Calendar.DAY_OF_MONTH, intervalVal);
                break;

            case "WEEKLY":
                cal.add(Calendar.WEEK_OF_YEAR, intervalVal);
                break;

            case "MONTHLY":
                cal.add(Calendar.MONTH, intervalVal);

                // Ensure day of month is valid for the new month
                int maxDayInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
                int targetDay = Math.min(dayOfMonth, maxDayInMonth);
                cal.set(Calendar.DAY_OF_MONTH, targetDay);
                break;

            case "YEARLY":
                cal.add(Calendar.YEAR, intervalVal);
                break;
        }

        return cal.getTime();
    }

    /**
     * Convert day of week string to Calendar constant
     * @param dayOfWeek Day of week (SUNDAY-SATURDAY)
     * @return Calendar day constant (1-7, 1=SUNDAY)
     */
    private static int convertDayOfWeekToCalendar(String dayOfWeek) {
        if (dayOfWeek == null) {
            return Calendar.SUNDAY; // Default
        }

        switch (dayOfWeek.toUpperCase()) {
            case "SUNDAY":
                return Calendar.SUNDAY;
            case "MONDAY":
                return Calendar.MONDAY;
            case "TUESDAY":
                return Calendar.TUESDAY;
            case "WEDNESDAY":
                return Calendar.WEDNESDAY;
            case "THURSDAY":
                return Calendar.THURSDAY;
            case "FRIDAY":
                return Calendar.FRIDAY;
            case "SATURDAY":
                return Calendar.SATURDAY;
            default:
                return Calendar.SUNDAY;
        }
    }

    /**
     * Generate a human-readable frequency description
     * @param frequency Frequency type
     * @param intervalVal Interval value
     * @param dayOfMonth Day of month (for MONTHLY)
     * @param dayOfWeek Day of week (for WEEKLY)
     * @return Frequency description string
     */
    public static String generateFrequencyDescription(String frequency, Integer intervalVal,
                                                      Integer dayOfMonth, String dayOfWeek) {
        StringBuilder desc = new StringBuilder();

        // Handle interval
        if (intervalVal == 1) {
            desc.append("Every ");
        } else {
            desc.append("Every ").append(intervalVal).append(" ");
        }

        // Add frequency
        switch (frequency) {
            case "DAILY":
                desc.append(intervalVal == 1 ? "day" : "days");
                break;

            case "WEEKLY":
                desc.append(intervalVal == 1 ? "week" : "weeks");
                if (dayOfWeek != null) {
                    desc.append(" on ").append(capitalize(dayOfWeek));
                }
                break;

            case "MONTHLY":
                desc.append(intervalVal == 1 ? "month" : "months");
                if (dayOfMonth != null) {
                    desc.append(" on the ").append(dayOfMonth).append(getOrdinalSuffix(dayOfMonth));
                }
                break;

            case "YEARLY":
                desc.append(intervalVal == 1 ? "year" : "years");
                break;
        }

        return desc.toString();
    }

    /**
     * Get ordinal suffix for a number (st, nd, rd, th)
     * @param number The number
     * @return Ordinal suffix
     */
    private static String getOrdinalSuffix(int number) {
        if (number >= 11 && number <= 13) {
            return "th";
        }
        switch (number % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }

    /**
     * Capitalize first letter of a string
     * @param str Input string
     * @return Capitalized string
     */
    private static String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    /**
     * Check if a recurring rule has expired
     * @param endDate End date of the rule (null means no expiration)
     * @return true if expired, false otherwise
     */
    public static boolean isExpired(Date endDate) {
        if (endDate == null) {
            return false; // No end date = never expires
        }
        return new Date().after(endDate);
    }

    /**
     * Generate status description for a recurring rule
     * @param isActive Active status
     * @param endDate End date
     * @return Status description
     */
    public static String generateStatusDescription(Boolean isActive, Date endDate) {
        if (!isActive) {
            return "Inactive";
        }
        if (isExpired(endDate)) {
            return "Expired";
        }
        return "Active";
    }
}