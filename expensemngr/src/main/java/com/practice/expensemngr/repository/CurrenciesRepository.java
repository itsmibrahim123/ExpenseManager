package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.Currencies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CurrenciesRepository extends JpaRepository<Currencies, String>, JpaSpecificationExecutor<Currencies> {

}