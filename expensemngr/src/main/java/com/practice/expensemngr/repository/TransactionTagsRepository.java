package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.TransactionTags;
import com.practice.expensemngr.entity.TransactionTagsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TransactionTagsRepository extends JpaRepository<TransactionTags, TransactionTagsId>, JpaSpecificationExecutor<TransactionTags> {

    /**
     * Find all tags for a specific transaction
     * @param transactionId Transaction ID
     * @return List of transaction tags
     */
    List<TransactionTags> findByTransactionId(Long transactionId);

    /**
     * Find all transactions with a specific tag
     * @param tagId Tag ID
     * @return List of transaction tags
     */
    List<TransactionTags> findByTagId(Long tagId);

    /**
     * Check if a transaction has a specific tag
     * @param transactionId Transaction ID
     * @param tagId Tag ID
     * @return true if exists
     */
    boolean existsByTransactionIdAndTagId(Long transactionId, Long tagId);

    /**
     * Delete all tags for a specific transaction
     * @param transactionId Transaction ID
     */
    void deleteByTransactionId(Long transactionId);

    /**
     * Delete all assignments for a specific tag
     * @param tagId Tag ID
     */
    void deleteByTagId(Long tagId);

    /**
     * Count transactions using a specific tag
     * @param tagId Tag ID
     * @return Count of transactions
     */
    long countByTagId(Long tagId);
}