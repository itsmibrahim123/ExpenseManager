package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TransactionsRepository extends JpaRepository<Transactions, Long>, JpaSpecificationExecutor<Transactions> {

    List<Transactions> findByUserId(Long userId);
    
    /**
     * Check if account has any transactions
     * @param accountId Account ID to check
     * @return true if transactions exist
     */
    boolean existsByAccountId(Long accountId);
}