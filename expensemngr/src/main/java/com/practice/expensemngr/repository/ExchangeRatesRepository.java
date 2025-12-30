package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.ExchangeRates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExchangeRatesRepository extends JpaRepository<ExchangeRates, Long>, JpaSpecificationExecutor<ExchangeRates> {

}