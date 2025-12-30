package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.TagAssignmentRequestDTO;
import com.practice.expensemngr.dto.TagCreateRequestDTO;
import com.practice.expensemngr.dto.TagDTO;
import com.practice.expensemngr.dto.TagUpdateRequestDTO;
import com.practice.expensemngr.service.TagsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tags")
public class TagsController {

    @Autowired
    private TagsService tagsService;

    /**
     * Create a new tag
     * @param request Tag creation data
     * @return Created tag
     */
    @PostMapping
    public ResponseEntity<TagDTO> createTag(@Valid @RequestBody TagCreateRequestDTO request) {
        TagDTO tag = tagsService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tag);
    }

    /**
     * Get all tags for a user
     * @param userId User ID
     * @return List of tags
     */
    @GetMapping
    public ResponseEntity<List<TagDTO>> getTagsByUser(@RequestParam @NotNull Long userId) {
        List<TagDTO> tags = tagsService.getTagsByUser(userId);
        return ResponseEntity.ok(tags);
    }

    /**
     * Get single tag by ID
     * @param id Tag ID
     * @return Tag details
     */
    @GetMapping("/{id}")
    public ResponseEntity<TagDTO> getTagById(@PathVariable @NotNull Long id) {
        TagDTO tag = tagsService.getTagById(id);
        return ResponseEntity.ok(tag);
    }

    /**
     * Update a tag
     * @param id Tag ID
     * @param request Update data
     * @return Updated tag
     */
    @PutMapping("/{id}")
    public ResponseEntity<TagDTO> updateTag(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody TagUpdateRequestDTO request) {
        TagDTO tag = tagsService.updateTag(id, request);
        return ResponseEntity.ok(tag);
    }

    /**
     * Delete a tag (also removes all assignments)
     * @param id Tag ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable @NotNull Long id) {
        tagsService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assign a tag to a transaction
     * @param transactionId Transaction ID
     * @param request Assignment request
     * @return No content
     */
    @PostMapping("/transactions/{transactionId}")
    public ResponseEntity<Void> assignTagToTransaction(
            @PathVariable @NotNull Long transactionId,
            @Valid @RequestBody TagAssignmentRequestDTO request) {
        tagsService.assignTagToTransaction(transactionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Remove a tag from a transaction
     * @param transactionId Transaction ID
     * @param tagId Tag ID
     * @return No content
     */
    @DeleteMapping("/transactions/{transactionId}/tags/{tagId}")
    public ResponseEntity<Void> removeTagFromTransaction(
            @PathVariable @NotNull Long transactionId,
            @PathVariable @NotNull Long tagId) {
        tagsService.removeTagFromTransaction(transactionId, tagId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all tags for a specific transaction
     * @param transactionId Transaction ID
     * @return List of tags
     */
    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<List<TagDTO>> getTagsForTransaction(
            @PathVariable @NotNull Long transactionId) {
        List<TagDTO> tags = tagsService.getTagsForTransaction(transactionId);
        return ResponseEntity.ok(tags);
    }
}