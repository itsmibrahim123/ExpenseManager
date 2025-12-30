package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.*;
import io.saadmughal.assignment05.entity.BudgetItems;
import io.saadmughal.assignment05.entity.Budgets;
import io.saadmughal.assignment05.entity.Categories;
import io.saadmughal.assignment05.exception.BudgetItemNotFoundException;
import io.saadmughal.assignment05.exception.BudgetNotFoundException;
import io.saadmughal.assignment05.exception.InvalidDateRangeException;
import io.saadmughal.assignment05.exception.InvalidPeriodTypeException;
import io.saadmughal.assignment05.repository.BudgetItemsRepository;
import io.saadmughal.assignment05.repository.BudgetsRepository;
import io.saadmughal.assignment05.repository.CategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.saadmughal.assignment05.exception.CategoryNotFoundException;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BudgetsService {

    @Autowired
    private BudgetsRepository budgetsRepository;

    @Autowired
    private BudgetItemsRepository budgetItemsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    /**
     * Create a new budget with items
     * @param request Budget creation data
     * @return Created budget with items
     */
    @Transactional
    public BudgetWithItemsResponseDTO createBudget(BudgetCreateRequestDTO request) {
        // 1. Validate period type
        if (!isValidPeriodType(request.getPeriodType())) {
            throw new InvalidPeriodTypeException(request.getPeriodType());
        }

        // 2. Calculate end date based on period type if not CUSTOM
        Date endDate = request.getEndDate();
        if (!request.getPeriodType().equals("CUSTOM")) {
            endDate = calculateEndDate(request.getStartDate(), request.getPeriodType());
        } else {
            // For CUSTOM, end date must be provided
            if (endDate == null) {
                throw new InvalidDateRangeException();
            }
        }

        // 3. Validate date range
        if (endDate.before(request.getStartDate())) {
            throw new InvalidDateRangeException();
        }

        // 4. Create budget entity
        Budgets budget = Budgets.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .periodType(request.getPeriodType())
                .startDate(request.getStartDate())
                .endDate(endDate)
                .totalLimit(request.getTotalLimit())
                .notes(request.getNotes())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        budget = budgetsRepository.save(budget);

        // 5. Create budget items if provided
        List<BudgetItemDTO> itemDTOs = new ArrayList<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (BudgetItemDTO itemDTO : request.getItems()) {
                BudgetItems item = BudgetItems.builder()
                        .budgetId(budget.getId())
                        .categoryId(itemDTO.getCategoryId())
                        .limitAmount(itemDTO.getLimitAmount())
                        .warningPercent(itemDTO.getWarningPercent() != null ? itemDTO.getWarningPercent() : 80) // Default 80%
                        .build();

                item = budgetItemsRepository.save(item);

                // Get category name for response
                Categories category = categoriesRepository.findById(itemDTO.getCategoryId()).orElse(null);

                itemDTOs.add(BudgetItemDTO.builder()
                        .id(item.getId())
                        .categoryId(item.getCategoryId())
                        .limitAmount(item.getLimitAmount())
                        .warningPercent(item.getWarningPercent())
                        .categoryName(category != null ? category.getName() : null)
                        .build());
            }
        }

        // 6. Calculate status
        String status = calculateBudgetStatus(budget.getStartDate(), budget.getEndDate());

        // 7. Build and return response
        return BudgetWithItemsResponseDTO.builder()
                .id(budget.getId())
                .userId(budget.getUserId())
                .name(budget.getName())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .totalLimit(budget.getTotalLimit())
                .notes(budget.getNotes())
                .status(status)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .items(itemDTOs)
                .itemCount(itemDTOs.size())
                .build();
    }

    /**
     * Get all budgets for a user
     * @param userId User ID
     * @return List of budgets without items
     */
    public List<BudgetResponseDTO> getBudgetsByUser(Long userId) {
        List<Budgets> budgets = budgetsRepository.findByUserIdOrderByStartDateDesc(userId);

        return budgets.stream()
                .map(this::toBudgetResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single budget with all items
     * @param budgetId Budget ID
     * @return Budget with items
     */
    public BudgetWithItemsResponseDTO getBudgetWithItems(Long budgetId) {
        Budgets budget = budgetsRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException(budgetId));

        List<BudgetItems> items = budgetItemsRepository.findByBudgetId(budgetId);

        List<BudgetItemDTO> itemDTOs = items.stream()
                .map(item -> {
                    Categories category = categoriesRepository.findById(item.getCategoryId()).orElse(null);
                    return BudgetItemDTO.builder()
                            .id(item.getId())
                            .categoryId(item.getCategoryId())
                            .limitAmount(item.getLimitAmount())
                            .warningPercent(item.getWarningPercent())
                            .categoryName(category != null ? category.getName() : null)
                            .build();
                })
                .collect(Collectors.toList());

        String status = calculateBudgetStatus(budget.getStartDate(), budget.getEndDate());

        return BudgetWithItemsResponseDTO.builder()
                .id(budget.getId())
                .userId(budget.getUserId())
                .name(budget.getName())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .totalLimit(budget.getTotalLimit())
                .notes(budget.getNotes())
                .status(status)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .items(itemDTOs)
                .itemCount(itemDTOs.size())
                .build();
    }

    /**
     * Validate period type
     */
    private boolean isValidPeriodType(String periodType) {
        return periodType.equals("MONTHLY") ||
                periodType.equals("WEEKLY") ||
                periodType.equals("YEARLY") ||
                periodType.equals("CUSTOM");
    }

    /**
     * Calculate end date based on period type
     */
    private Date calculateEndDate(Date startDate, String periodType) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(startDate);

        switch (periodType) {
            case "WEEKLY":
                cal.add(Calendar.DAY_OF_MONTH, 7);
                break;
            case "MONTHLY":
                cal.add(Calendar.MONTH, 1);
                break;
            case "YEARLY":
                cal.add(Calendar.YEAR, 1);
                break;
        }

        // Subtract 1 day to make it inclusive
        cal.add(Calendar.DAY_OF_MONTH, -1);
        return cal.getTime();
    }

    /**
     * Calculate budget status based on dates
     */
    private String calculateBudgetStatus(Date startDate, Date endDate) {
        Date now = new Date();

        if (now.before(startDate)) {
            return "UPCOMING";
        } else if (now.after(endDate)) {
            return "EXPIRED";
        } else {
            return "ACTIVE";
        }
    }

    /**
     * Convert entity to basic response DTO
     */
    private BudgetResponseDTO toBudgetResponseDTO(Budgets budget) {
        String status = calculateBudgetStatus(budget.getStartDate(), budget.getEndDate());

        return BudgetResponseDTO.builder()
                .id(budget.getId())
                .userId(budget.getUserId())
                .name(budget.getName())
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .totalLimit(budget.getTotalLimit())
                .notes(budget.getNotes())
                .status(status)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }

    /**
     * Update an existing budget
     * @param budgetId Budget ID
     * @param request Update data
     * @return Updated budget with items
     */
    @Transactional
    public BudgetWithItemsResponseDTO updateBudget(Long budgetId, BudgetUpdateRequestDTO request) {
        // 1. Find existing budget
        Budgets budget = budgetsRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException(budgetId));

        // 2. Update fields
        budget.setName(request.getName());

        if (request.getStartDate() != null) {
            budget.setStartDate(request.getStartDate());
        }

        if (request.getEndDate() != null) {
            budget.setEndDate(request.getEndDate());
        }

        // 3. Validate date range if both dates are present
        if (budget.getEndDate().before(budget.getStartDate())) {
            throw new InvalidDateRangeException();
        }

        if (request.getTotalLimit() != null) {
            budget.setTotalLimit(request.getTotalLimit());
        }

        if (request.getNotes() != null) {
            budget.setNotes(request.getNotes());
        }

        budget.setUpdatedAt(new Date());

        budget = budgetsRepository.save(budget);

        // 4. Return updated budget with items
        return getBudgetWithItems(budgetId);
    }

    /**
     * Delete a budget and all its items
     * @param budgetId Budget ID
     */
    @Transactional
    public void deleteBudget(Long budgetId) {
        // 1. Verify budget exists
        Budgets budget = budgetsRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException(budgetId));

        // 2. Delete all budget items first
        budgetItemsRepository.deleteByBudgetId(budgetId);

        // 3. Delete budget
        budgetsRepository.delete(budget);
    }

    /**
     * Add a new item to an existing budget
     * @param budgetId Budget ID
     * @param itemDTO Item data
     * @return Created budget item
     */
    @Transactional
    public BudgetItemDTO addBudgetItem(Long budgetId, BudgetItemDTO itemDTO) {
        // 1. Verify budget exists
        Budgets budget = budgetsRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException(budgetId));

        // 2. Verify category exists
        Categories category = categoriesRepository.findById(itemDTO.getCategoryId())
                .orElseThrow(() -> new CategoryNotFoundException(itemDTO.getCategoryId()));

        // 3. Create budget item
        BudgetItems item = BudgetItems.builder()
                .budgetId(budgetId)
                .categoryId(itemDTO.getCategoryId())
                .limitAmount(itemDTO.getLimitAmount())
                .warningPercent(itemDTO.getWarningPercent() != null ? itemDTO.getWarningPercent() : 80)
                .build();

        item = budgetItemsRepository.save(item);

        // 4. Return item with category name
        return BudgetItemDTO.builder()
                .id(item.getId())
                .categoryId(item.getCategoryId())
                .limitAmount(item.getLimitAmount())
                .warningPercent(item.getWarningPercent())
                .categoryName(category.getName())
                .build();
    }

    /**
     * Update an existing budget item
     * @param itemId Item ID
     * @param itemDTO Updated item data
     * @return Updated budget item
     */
    @Transactional
    public BudgetItemDTO updateBudgetItem(Long itemId, BudgetItemDTO itemDTO) {
        // 1. Find existing item
        BudgetItems item = budgetItemsRepository.findById(itemId)
                .orElseThrow(() -> new BudgetItemNotFoundException(itemId));

        // 2. Update fields
        if (itemDTO.getCategoryId() != null) {
            // Verify category exists
            categoriesRepository.findById(itemDTO.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(itemDTO.getCategoryId()));
            item.setCategoryId(itemDTO.getCategoryId());
        }

        if (itemDTO.getLimitAmount() != null) {
            item.setLimitAmount(itemDTO.getLimitAmount());
        }

        if (itemDTO.getWarningPercent() != null) {
            item.setWarningPercent(itemDTO.getWarningPercent());
        }

        item = budgetItemsRepository.save(item);

        // 3. Get category name for response
        Categories category = categoriesRepository.findById(item.getCategoryId()).orElse(null);

        // 4. Return updated item
        return BudgetItemDTO.builder()
                .id(item.getId())
                .categoryId(item.getCategoryId())
                .limitAmount(item.getLimitAmount())
                .warningPercent(item.getWarningPercent())
                .categoryName(category != null ? category.getName() : null)
                .build();
    }

    /**
     * Delete a budget item
     * @param itemId Item ID
     */
    @Transactional
    public void deleteBudgetItem(Long itemId) {
        // 1. Verify item exists
        BudgetItems item = budgetItemsRepository.findById(itemId)
                .orElseThrow(() -> new BudgetItemNotFoundException(itemId));

        // 2. Delete item
        budgetItemsRepository.delete(item);
    }

    /**
     * Get all items for a budget
     * @param budgetId Budget ID
     * @return List of budget items
     */
    public List<BudgetItemDTO> getBudgetItems(Long budgetId) {
        // 1. Verify budget exists
        budgetsRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException(budgetId));

        // 2. Get all items
        List<BudgetItems> items = budgetItemsRepository.findByBudgetId(budgetId);

        // 3. Convert to DTOs with category names
        return items.stream()
                .map(item -> {
                    Categories category = categoriesRepository.findById(item.getCategoryId()).orElse(null);
                    return BudgetItemDTO.builder()
                            .id(item.getId())
                            .categoryId(item.getCategoryId())
                            .limitAmount(item.getLimitAmount())
                            .warningPercent(item.getWarningPercent())
                            .categoryName(category != null ? category.getName() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }
}