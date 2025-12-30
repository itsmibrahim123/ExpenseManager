package com.practice.expensemngr.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for file storage
 */
@Configuration
@ConfigurationProperties(prefix = "file.upload")
public class FileStorageProperties {

    private String dir = "uploads/receipts";
    private long maxFileSize = 10485760; // 10MB in bytes
    private long maxRequestSize = 52428800; // 50MB in bytes
    private String[] allowedTypes = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf"
    };

    public String getDir() {
        return dir;
    }

    public void setDir(String dir) {
        this.dir = dir;
    }

    public long getMaxFileSize() {
        return maxFileSize;
    }

    public void setMaxFileSize(long maxFileSize) {
        this.maxFileSize = maxFileSize;
    }

    public long getMaxRequestSize() {
        return maxRequestSize;
    }

    public void setMaxRequestSize(long maxRequestSize) {
        this.maxRequestSize = maxRequestSize;
    }

    public String[] getAllowedTypes() {
        return allowedTypes;
    }

    public void setAllowedTypes(String[] allowedTypes) {
        this.allowedTypes = allowedTypes;
    }
}