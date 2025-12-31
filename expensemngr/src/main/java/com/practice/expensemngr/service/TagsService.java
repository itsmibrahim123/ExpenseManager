package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.TagAssignmentRequestDTO;
import com.practice.expensemngr.dto.TagCreateRequestDTO;
import com.practice.expensemngr.dto.TagDTO;
import com.practice.expensemngr.dto.TagUpdateRequestDTO;
import com.practice.expensemngr.entity.Tags;
import com.practice.expensemngr.entity.TransactionTags;
import com.practice.expensemngr.entity.TransactionTagsId;
import com.practice.expensemngr.entity.Transactions;
import com.practice.expensemngr.exception.TagAlreadyExistsException;
import com.practice.expensemngr.exception.TagNotFoundException;
import com.practice.expensemngr.exception.TransactionNotFoundException;
import com.practice.expensemngr.repository.TagsRepository;
import com.practice.expensemngr.repository.TransactionTagsRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagsService {

    @Autowired
    private TagsRepository tagsRepository;

    @Autowired
    private TransactionTagsRepository transactionTagsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    /**
     * Create a new tag
     * @param request Tag creation data
     * @return Created tag
     */
    @Transactional
    public TagDTO createTag(TagCreateRequestDTO request) {
        // 1. Check if tag with same name already exists for this user
        if (tagsRepository.existsByUserIdAndName(request.getUserId(), request.getName())) {
            throw new TagAlreadyExistsException(request.getName());
        }

        // 2. Create tag entity
        Tags tag = Tags.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .color(request.getColor())
                .createdAt(new Date())
                .build();

        tag = tagsRepository.save(tag);

        // 3. Return DTO
        return toTagDTO(tag);
    }

    /**
     * Get all tags for a user
     * @param userId User ID
     * @return List of tags
     */
    public List<TagDTO> getTagsByUser(Long userId) {
        List<Tags> tags = tagsRepository.findByUserIdOrderByNameAsc(userId);

        return tags.stream()
                .map(this::toTagDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single tag by ID
     * @param tagId Tag ID
     * @return Tag details
     */
    public TagDTO getTagById(Long tagId) {
        Tags tag = tagsRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException(tagId));

        return toTagDTO(tag);
    }

    /**
     * Update a tag
     * @param tagId Tag ID
     * @param request Update data
     * @return Updated tag
     */
    @Transactional
    public TagDTO updateTag(Long tagId, TagUpdateRequestDTO request) {
        // 1. Find existing tag
        Tags tag = tagsRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException(tagId));

        // 2. Check if new name conflicts with another tag
        if (!tag.getName().equals(request.getName())) {
            if (tagsRepository.existsByUserIdAndName(tag.getUserId(), request.getName())) {
                throw new TagAlreadyExistsException(request.getName());
            }
        }

        // 3. Update fields
        tag.setName(request.getName());
        tag.setColor(request.getColor());

        tag = tagsRepository.save(tag);

        // 4. Return updated tag
        return toTagDTO(tag);
    }

    /**
     * Delete a tag (also removes all assignments)
     * @param tagId Tag ID
     */
    @Transactional
    public void deleteTag(Long tagId) {
        // 1. Verify tag exists
        Tags tag = tagsRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException(tagId));

        // 2. Delete all transaction tag assignments
        transactionTagsRepository.deleteByTagId(tagId);

        // 3. Delete the tag
        tagsRepository.delete(tag);
    }

    /**
     * Assign a tag to a transaction
     * @param transactionId Transaction ID
     * @param request Assignment request
     */
    @Transactional
    public void assignTagToTransaction(Long transactionId, TagAssignmentRequestDTO request) {
        // 1. Verify transaction exists
        Transactions transaction = transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // 2. Verify tag exists
        Tags tag = tagsRepository.findById(request.getTagId())
                .orElseThrow(() -> new TagNotFoundException(request.getTagId()));

        // 3. Verify tag belongs to same user as transaction
        if (!tag.getUserId().equals(transaction.getUserId())) {
            throw new TagNotFoundException(request.getTagId());
        }

        // 4. Check if already assigned
        if (transactionTagsRepository.existsByTransactionIdAndTagId(transactionId, request.getTagId())) {
            // Already assigned, do nothing (idempotent)
            return;
        }

        // 5. Create assignment
        TransactionTags transactionTag = TransactionTags.builder()
                .transactionId(transactionId)
                .tagId(request.getTagId())
                .build();

        transactionTagsRepository.save(transactionTag);
    }

    /**
     * Remove a tag from a transaction
     * @param transactionId Transaction ID
     * @param tagId Tag ID
     */
    @Transactional
    public void removeTagFromTransaction(Long transactionId, Long tagId) {
        // 1. Verify transaction exists
        transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // 2. Verify tag exists
        tagsRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException(tagId));

        // 3. Create composite key
        TransactionTagsId id = new TransactionTagsId(transactionId, tagId);

        // 4. Delete if exists
        if (transactionTagsRepository.existsById(id)) {
            transactionTagsRepository.deleteById(id);
        }
    }

    /**
     * Get all tags for a specific transaction
     * @param transactionId Transaction ID
     * @return List of tags
     */
    public List<TagDTO> getTagsForTransaction(Long transactionId) {
        // 1. Verify transaction exists
        transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // 2. Get all tag assignments for this transaction
        List<TransactionTags> transactionTags = transactionTagsRepository.findByTransactionId(transactionId);

        // 3. Fetch tag details
        return transactionTags.stream()
                .map(tt -> tagsRepository.findById(tt.getTagId()))
                .filter(optional -> optional.isPresent())
                .map(optional -> toTagDTO(optional.get()))
                .collect(Collectors.toList());
    }

    /**
     * Get or create tag by name (used during tag assignment)
     * @param userId User ID
     * @param tagName Tag name
     * @return Tag
     */
    @Transactional
    public Tags getOrCreateTag(Long userId, String tagName) {
        // Check if tag exists
        return tagsRepository.findByUserIdAndName(userId, tagName)
                .orElseGet(() -> {
                    // Create new tag
                    Tags newTag = Tags.builder()
                            .userId(userId)
                            .name(tagName)
                            .createdAt(new Date())
                            .build();
                    return tagsRepository.save(newTag);
                });
    }

    /**
     * Convert entity to DTO
     */
    private TagDTO toTagDTO(Tags tag) {
        // Count transactions using this tag
        long transactionCount = transactionTagsRepository.countByTagId(tag.getId());

        return TagDTO.builder()
                .id(tag.getId())
                .userId(tag.getUserId())
                .name(tag.getName())
                .color(tag.getColor())
                .createdAt(tag.getCreatedAt())
                .transactionCount((int) transactionCount)
                .build();
    }
}