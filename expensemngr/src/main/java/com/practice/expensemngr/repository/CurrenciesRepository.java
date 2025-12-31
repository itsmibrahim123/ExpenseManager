package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Currencies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CurrenciesRepository extends JpaRepository<Currencies, String>, JpaSpecificationExecutor<Currencies> {

}