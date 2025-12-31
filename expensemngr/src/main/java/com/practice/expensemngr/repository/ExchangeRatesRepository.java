package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.ExchangeRates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExchangeRatesRepository extends JpaRepository<ExchangeRates, Long>, JpaSpecificationExecutor<ExchangeRates> {

}