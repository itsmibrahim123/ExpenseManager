package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.service.BudgetsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/budgets")
public class BudgetsController {

    @Autowired
    private BudgetsService budgetsService;

    /**
     * Create a new budget with items
     * @param request Budget creation data
     * @return Created budget with items
     */
    @PostMapping
    public ResponseEntity<BudgetWithItemsResponseDTO> createBudget(
            @Valid @RequestBody BudgetCreateRequestDTO request) {
        BudgetWithItemsResponseDTO response = budgetsService.createBudget(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all budgets for a user
     * @param userId User ID
     * @return List of budgets
     */
    @GetMapping
    public ResponseEntity<List<BudgetResponseDTO>> getBudgetsByUser(
            @RequestParam @NotNull Long userId) {
        List<BudgetResponseDTO> budgets = budgetsService.getBudgetsByUser(userId);
        return ResponseEntity.ok(budgets);
    }

    /**
     * Get single budget with all items
     * @param id Budget ID
     * @return Budget with items
     */
    @GetMapping("/{id}")
    public ResponseEntity<BudgetWithItemsResponseDTO> getBudgetWithItems(
            @PathVariable @NotNull Long id) {
        BudgetWithItemsResponseDTO budget = budgetsService.getBudgetWithItems(id);
        return ResponseEntity.ok(budget);
    }

    /**
     * Update an existing budget
     * @param id Budget ID
     * @param request Update data
     * @return Updated budget with items
     */
    @PutMapping("/{id}")
    public ResponseEntity<BudgetWithItemsResponseDTO> updateBudget(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody BudgetUpdateRequestDTO request) {
        BudgetWithItemsResponseDTO response = budgetsService.updateBudget(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a budget and all its items
     * @param id Budget ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable @NotNull Long id) {
        budgetsService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all items for a budget
     * @param budgetId Budget ID
     * @return List of budget items
     */
    @GetMapping("/{budgetId}/items")
    public ResponseEntity<List<BudgetItemDTO>> getBudgetItems(
            @PathVariable @NotNull Long budgetId) {
        List<BudgetItemDTO> items = budgetsService.getBudgetItems(budgetId);
        return ResponseEntity.ok(items);
    }

    /**
     * Add a new item to a budget
     * @param budgetId Budget ID
     * @param itemDTO Item data
     * @return Created item
     */
    @PostMapping("/{budgetId}/items")
    public ResponseEntity<BudgetItemDTO> addBudgetItem(
            @PathVariable @NotNull Long budgetId,
            @Valid @RequestBody BudgetItemDTO itemDTO) {
        BudgetItemDTO response = budgetsService.addBudgetItem(budgetId, itemDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing budget item
     * @param budgetId Budget ID (for path consistency)
     * @param itemId Item ID
     * @param itemDTO Updated item data
     * @return Updated item
     */
    @PutMapping("/{budgetId}/items/{itemId}")
    public ResponseEntity<BudgetItemDTO> updateBudgetItem(
            @PathVariable @NotNull Long budgetId,
            @PathVariable @NotNull Long itemId,
            @Valid @RequestBody BudgetItemDTO itemDTO) {
        BudgetItemDTO response = budgetsService.updateBudgetItem(itemId, itemDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a budget item
     * @param budgetId Budget ID (for path consistency)
     * @param itemId Item ID
     * @return No content
     */
    @DeleteMapping("/{budgetId}/items/{itemId}")
    public ResponseEntity<Void> deleteBudgetItem(
            @PathVariable @NotNull Long budgetId,
            @PathVariable @NotNull Long itemId) {
        budgetsService.deleteBudgetItem(itemId);
        return ResponseEntity.noContent().build();
    }
}