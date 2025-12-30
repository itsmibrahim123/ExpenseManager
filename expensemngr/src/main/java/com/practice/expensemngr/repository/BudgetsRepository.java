package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.Budgets;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface BudgetsRepository extends JpaRepository<Budgets, Long>, JpaSpecificationExecutor<Budgets> {

    /**
     * Find all budgets for a specific user
     * @param userId User ID
     * @return List of budgets
     */
    List<Budgets> findByUserId(Long userId);

    /**
     * Find all budgets for a user, ordered by start date descending
     * @param userId User ID
     * @return List of budgets
     */
    List<Budgets> findByUserIdOrderByStartDateDesc(Long userId);
}