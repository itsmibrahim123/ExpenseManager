package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.PaymentMethods;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PaymentMethodsRepository extends JpaRepository<PaymentMethods, Long>, JpaSpecificationExecutor<PaymentMethods> {
}