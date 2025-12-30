package io.saadmughal.assignment05.controller;

com.practice.expensemngr.dto.AttachmentDTO;
com.practice.expensemngr.dto.AttachmentUploadResponseDTO;
com.practice.expensemngr.entity.Attachments;
com.practice.expensemngr.service.AttachmentService;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/attachments")
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    /**
     * Upload one or more files to a transaction
     * @param transactionId Transaction ID (required)
     * @param files Array of files to upload
     * @return Upload response with success/failure details
     */
    @PostMapping("/upload")
    public ResponseEntity<AttachmentUploadResponseDTO> uploadAttachments(
            @RequestParam @NotNull Long transactionId,
            @RequestParam("files") MultipartFile[] files) {

        AttachmentUploadResponseDTO response = attachmentService.uploadAttachments(transactionId, files);

        // Return 201 if all succeeded, 207 (Multi-Status) if partial success, 400 if all failed
        HttpStatus status;
        if (response.getSuccessCount() > 0 && response.getFailureCount() == 0) {
            status = HttpStatus.CREATED;
        } else if (response.getSuccessCount() > 0 && response.getFailureCount() > 0) {
            status = HttpStatus.MULTI_STATUS;
        } else {
            status = HttpStatus.BAD_REQUEST;
        }

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Get all attachments for a specific transaction
     * @param transactionId Transaction ID
     * @return List of attachments
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<AttachmentDTO>> getAttachmentsByTransaction(
            @PathVariable @NotNull Long transactionId) {
        List<AttachmentDTO> attachments = attachmentService.getAttachmentsByTransaction(transactionId);
        return ResponseEntity.ok(attachments);
    }

    /**
     * Get single attachment metadata
     * @param id Attachment ID
     * @return Attachment details
     */
    @GetMapping("/{id}")
    public ResponseEntity<AttachmentDTO> getAttachmentById(@PathVariable @NotNull Long id) {
        AttachmentDTO attachment = attachmentService.getAttachmentById(id);
        return ResponseEntity.ok(attachment);
    }

    /**
     * Download attachment file
     * @param id Attachment ID
     * @return File as resource with proper headers
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable @NotNull Long id) {
        // Load file as Resource
        Resource resource = attachmentService.loadAttachmentAsResource(id);

        // Get attachment metadata for headers
        Attachments attachment = attachmentService.getAttachmentEntity(id);

        // Set content type
        String contentType = attachment.getMimeType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        // Build response with headers
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    /**
     * Delete attachment
     * @param id Attachment ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable @NotNull Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}