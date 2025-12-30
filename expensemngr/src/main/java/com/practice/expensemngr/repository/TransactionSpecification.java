package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Transactions;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.Date;

public class TransactionSpecification {

    public static Specification<Transactions> filterTransactions(
            Long userId,
            String category,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Date startDate,
            Date endDate
    ) {
        return (root, query, criteriaBuilder) -> {
            // 1. Always filter by User ID
            var predicate = criteriaBuilder.equal(root.get("userId"), userId);

            // 2. Optional: Filter by Category
            if (category != null && !category.isEmpty()) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(root.get("category"), category));
            }

            // 3. Optional: Min Amount
            if (minAmount != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }

            // 4. Optional: Max Amount
            if (maxAmount != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }

            // 5. Optional: Date Range
            if (startDate != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }
            if (endDate != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            return predicate;
        };
    }
}