package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TransactionsRepository extends JpaRepository<Transactions, Long>, JpaSpecificationExecutor<Transactions> {

    /**
     * Check if account has any transactions
     * @param accountId Account ID to check
     * @return true if transactions exist
     */
    boolean existsByAccountId(Long accountId);
}