package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.RecurringRuleCreateRequestDTO;
import com.practice.expensemngr.dto.RecurringRuleResponseDTO;
import com.practice.expensemngr.dto.RecurringRuleUpdateRequestDTO;
import com.practice.expensemngr.service.RecurringRulesService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recurring-rules")
public class RecurringRulesController {

    @Autowired
    private RecurringRulesService recurringRulesService;

    /**
     * Create a new recurring rule
     * @param request Recurring rule creation data
     * @return Created recurring rule
     */
    @PostMapping
    public ResponseEntity<RecurringRuleResponseDTO> createRecurringRule(
            @Valid @RequestBody RecurringRuleCreateRequestDTO request) {
        RecurringRuleResponseDTO response = recurringRulesService.createRecurringRule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all recurring rules for a user with optional filters
     * @param userId User ID (required)
     * @param active Filter by active status (optional)
     * @param type Filter by transaction type (optional: EXPENSE, INCOME, TRANSFER)
     * @return List of recurring rules
     */
    @GetMapping
    public ResponseEntity<List<RecurringRuleResponseDTO>> getRecurringRulesByUser(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String type) {
        List<RecurringRuleResponseDTO> rules = recurringRulesService.getRecurringRulesByUser(userId, active, type);
        return ResponseEntity.ok(rules);
    }

    /**
     * Get single recurring rule by ID
     * @param id Rule ID
     * @return Recurring rule details
     */
    @GetMapping("/{id}")
    public ResponseEntity<RecurringRuleResponseDTO> getRecurringRuleById(
            @PathVariable @NotNull Long id) {
        RecurringRuleResponseDTO rule = recurringRulesService.getRecurringRuleById(id);
        return ResponseEntity.ok(rule);
    }

    /**
     * Get all recurring rules for a specific account
     * @param accountId Account ID
     * @return List of recurring rules
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<RecurringRuleResponseDTO>> getRecurringRulesByAccount(
            @PathVariable @NotNull Long accountId) {
        List<RecurringRuleResponseDTO> rules = recurringRulesService.getRecurringRulesByAccount(accountId);
        return ResponseEntity.ok(rules);
    }

    /**
     * Update an existing recurring rule
     * @param id Rule ID
     * @param request Update data
     * @return Updated recurring rule
     */
    @PutMapping("/{id}")
    public ResponseEntity<RecurringRuleResponseDTO> updateRecurringRule(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody RecurringRuleUpdateRequestDTO request) {
        RecurringRuleResponseDTO response = recurringRulesService.updateRecurringRule(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a recurring rule
     * @param id Rule ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringRule(@PathVariable @NotNull Long id) {
        recurringRulesService.deleteRecurringRule(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Toggle active status of a recurring rule
     * @param id Rule ID
     * @param active New active status
     * @return Updated recurring rule
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RecurringRuleResponseDTO> toggleRecurringRule(
            @PathVariable @NotNull Long id,
            @RequestParam @NotNull Boolean active) {
        RecurringRuleResponseDTO response = recurringRulesService.toggleRecurringRule(id, active);
        return ResponseEntity.ok(response);
    }

    /**
     * Activate a recurring rule
     * @param id Rule ID
     * @return Updated recurring rule
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<RecurringRuleResponseDTO> activateRecurringRule(
            @PathVariable @NotNull Long id) {
        RecurringRuleResponseDTO response = recurringRulesService.activateRecurringRule(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Deactivate a recurring rule
     * @param id Rule ID
     * @return Updated recurring rule
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<RecurringRuleResponseDTO> deactivateRecurringRule(
            @PathVariable @NotNull Long id) {
        RecurringRuleResponseDTO response = recurringRulesService.deactivateRecurringRule(id);
        return ResponseEntity.ok(response);
    }
}