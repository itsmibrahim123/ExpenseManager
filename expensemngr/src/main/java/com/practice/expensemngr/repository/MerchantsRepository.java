package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Merchants;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MerchantsRepository extends JpaRepository<Merchants, Long>, JpaSpecificationExecutor<Merchants> {
}