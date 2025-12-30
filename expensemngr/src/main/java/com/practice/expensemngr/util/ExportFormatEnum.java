package io.saadmughal.assignment05.util;

/**
 * Enum for export file formats
 */
public enum ExportFormatEnum {
    CSV("CSV", "text/csv", ".csv"),
    JSON("JSON", "application/json", ".json"),
    EXCEL("Excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"),
    PDF("PDF", "application/pdf", ".pdf");

    private final String displayName;
    private final String mimeType;
    private final String extension;

    ExportFormatEnum(String displayName, String mimeType, String extension) {
        this.displayName = displayName;
        this.mimeType = mimeType;
        this.extension = extension;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getExtension() {
        return extension;
    }
}