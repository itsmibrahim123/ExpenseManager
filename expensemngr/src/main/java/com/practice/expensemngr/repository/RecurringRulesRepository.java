package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.RecurringRules;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Date;
import java.util.List;

public interface RecurringRulesRepository extends JpaRepository<RecurringRules, Long>, JpaSpecificationExecutor<RecurringRules> {

    /**
     * Find all recurring rules for a specific user
     * @param userId User ID
     * @return List of recurring rules
     */
    List<RecurringRules> findByUserId(Long userId);

    /**
     * Find all active recurring rules for a specific user
     * @param userId User ID
     * @param active Active status
     * @return List of recurring rules
     */
    List<RecurringRules> findByUserIdAndActive(Long userId, Boolean active);

    /**
     * Find all recurring rules for a specific user and type
     * @param userId User ID
     * @param type Transaction type (EXPENSE, INCOME, TRANSFER)
     * @return List of recurring rules
     */
    List<RecurringRules> findByUserIdAndType(Long userId, String type);

    /**
     * Find all recurring rules for a specific user, type, and active status
     * @param userId User ID
     * @param type Transaction type
     * @param active Active status
     * @return List of recurring rules
     */
    List<RecurringRules> findByUserIdAndTypeAndActive(Long userId, String type, Boolean active);

    /**
     * Find all recurring rules for a specific account
     * @param accountId Account ID
     * @return List of recurring rules
     */
    List<RecurringRules> findByAccountId(Long accountId);

    /**
     * Find all active rules where next_run_date is on or before the given date
     * (Used by scheduler in Phase 2)
     * @param date Target date
     * @param active Active status
     * @return List of recurring rules ready to execute
     */
    List<RecurringRules> findByNextRunDateLessThanEqualAndActive(Date date, Boolean active);

    /**
     * Find all recurring rules ordered by next run date
     * @param userId User ID
     * @return List of recurring rules ordered by next run date
     */
    List<RecurringRules> findByUserIdOrderByNextRunDateAsc(Long userId);
}