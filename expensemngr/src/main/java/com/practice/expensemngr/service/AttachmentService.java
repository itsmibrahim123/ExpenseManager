package com.practice.expensemngr.service;

import com.practice.expensemngr.config.FileStorageProperties;
import com.practice.expensemngr.dto.AttachmentDTO;
import com.practice.expensemngr.dto.AttachmentUploadResponseDTO;
import com.practice.expensemngr.entity.Attachments;
import com.practice.expensemngr.entity.Transactions;
import com.practice.expensemngr.exception.AttachmentNotFoundException;
import com.practice.expensemngr.exception.FileSizeLimitExceededException;
import com.practice.expensemngr.exception.InvalidFileTypeException;
import com.practice.expensemngr.exception.TransactionNotFoundException;
import com.practice.expensemngr.repository.AttachmentsRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    @Autowired
    private AttachmentsRepository attachmentsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FileStorageProperties fileStorageProperties;

    /**
     * Upload one or more files and attach to transaction
     * @param transactionId Transaction ID
     * @param files Array of multipart files
     * @return Upload response with success/failure details
     */
    @Transactional
    public AttachmentUploadResponseDTO uploadAttachments(Long transactionId, MultipartFile[] files) {
        // 1. Verify transaction exists
        Transactions transaction = transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        List<AttachmentDTO> uploadedFiles = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // 2. Process each file
        for (MultipartFile file : files) {
            try {
                // Validate file
                validateFile(file);

                // Store file
                String storedFileName = fileStorageService.storeFile(file);

                // Create attachment record
                Attachments attachment = Attachments.builder()
                        .transactionId(transactionId)
                        .fileName(file.getOriginalFilename())
                        .filePath(fileStorageProperties.getDir() + "/" + storedFileName)
                        .mimeType(file.getContentType())
                        .fileSizeBytes(file.getSize())
                        .uploadedAt(new Date())
                        .build();

                attachment = attachmentsRepository.save(attachment);

                // Convert to DTO
                AttachmentDTO dto = toAttachmentDTO(attachment);
                uploadedFiles.add(dto);

            } catch (Exception e) {
                errors.add("Failed to upload " + file.getOriginalFilename() + ": " + e.getMessage());
            }
        }

        // 3. Build response
        String message;
        if (uploadedFiles.size() == files.length) {
            message = uploadedFiles.size() + " file(s) uploaded successfully";
        } else if (uploadedFiles.isEmpty()) {
            message = "All uploads failed";
        } else {
            message = uploadedFiles.size() + " file(s) uploaded, " + errors.size() + " failed";
        }

        return AttachmentUploadResponseDTO.builder()
                .uploaded(uploadedFiles)
                .errors(errors)
                .message(message)
                .successCount(uploadedFiles.size())
                .failureCount(errors.size())
                .build();
    }

    /**
     * Get all attachments for a transaction
     * @param transactionId Transaction ID
     * @return List of attachments
     */
    public List<AttachmentDTO> getAttachmentsByTransaction(Long transactionId) {
        // 1. Verify transaction exists
        transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // 2. Get attachments
        List<Attachments> attachments = attachmentsRepository.findByTransactionId(transactionId);

        // 3. Convert to DTOs
        return attachments.stream()
                .map(this::toAttachmentDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single attachment by ID
     * @param attachmentId Attachment ID
     * @return Attachment details
     */
    public AttachmentDTO getAttachmentById(Long attachmentId) {
        Attachments attachment = attachmentsRepository.findById(attachmentId)
                .orElseThrow(() -> new AttachmentNotFoundException(attachmentId));

        return toAttachmentDTO(attachment);
    }

    /**
     * Load attachment file as resource for download
     * @param attachmentId Attachment ID
     * @return File resource
     */
    public Resource loadAttachmentAsResource(Long attachmentId) {
        // 1. Get attachment record
        Attachments attachment = attachmentsRepository.findById(attachmentId)
                .orElseThrow(() -> new AttachmentNotFoundException(attachmentId));

        // 2. Extract stored filename from path
        String storedFileName = attachment.getFilePath().substring(
                attachment.getFilePath().lastIndexOf("/") + 1
        );

        // 3. Load file
        return fileStorageService.loadFileAsResource(storedFileName);
    }

    /**
     * Get attachment entity for download headers
     * @param attachmentId Attachment ID
     * @return Attachment entity
     */
    public Attachments getAttachmentEntity(Long attachmentId) {
        return attachmentsRepository.findById(attachmentId)
                .orElseThrow(() -> new AttachmentNotFoundException(attachmentId));
    }

    /**
     * Delete attachment
     * @param attachmentId Attachment ID
     */
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        // 1. Get attachment record
        Attachments attachment = attachmentsRepository.findById(attachmentId)
                .orElseThrow(() -> new AttachmentNotFoundException(attachmentId));

        // 2. Extract stored filename from path
        String storedFileName = attachment.getFilePath().substring(
                attachment.getFilePath().lastIndexOf("/") + 1
        );

        // 3. Delete physical file
        fileStorageService.deleteFile(storedFileName);

        // 4. Delete database record
        attachmentsRepository.delete(attachment);
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) {
        // 1. Check if file is empty
        if (file.isEmpty()) {
            throw new InvalidFileTypeException("empty file");
        }

        // 2. Check file size
        if (file.getSize() > fileStorageProperties.getMaxFileSize()) {
            throw new FileSizeLimitExceededException(
                    file.getSize(),
                    fileStorageProperties.getMaxFileSize()
            );
        }

        // 3. Check file type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedFileType(contentType)) {
            throw new InvalidFileTypeException(contentType);
        }
    }

    /**
     * Check if file type is allowed
     */
    private boolean isAllowedFileType(String contentType) {
        String[] allowedTypes = fileStorageProperties.getAllowedTypes();
        return Arrays.asList(allowedTypes).contains(contentType.toLowerCase());
    }

    /**
     * Convert entity to DTO
     */
    private AttachmentDTO toAttachmentDTO(Attachments attachment) {
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .transactionId(attachment.getTransactionId())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .mimeType(attachment.getMimeType())
                .fileSizeBytes(attachment.getFileSizeBytes())
                .uploadedAt(attachment.getUploadedAt())
                .downloadUrl("/attachments/" + attachment.getId() + "/download")
                .build();
    }
}