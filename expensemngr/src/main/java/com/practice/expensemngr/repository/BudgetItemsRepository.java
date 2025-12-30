package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.BudgetItems;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface BudgetItemsRepository extends JpaRepository<BudgetItems, Long>, JpaSpecificationExecutor<BudgetItems> {

    /**
     * Find all items for a specific budget
     * @param budgetId Budget ID
     * @return List of budget items
     */
    List<BudgetItems> findByBudgetId(Long budgetId);

    /**
     * Delete all items for a specific budget
     * @param budgetId Budget ID
     */
    void deleteByBudgetId(Long budgetId);

    /**
     * Check if budget has any items
     * @param budgetId Budget ID
     * @return true if items exist
     */
    boolean existsByBudgetId(Long budgetId);
}