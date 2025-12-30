package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.Merchants;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MerchantsRepository extends JpaRepository<Merchants, Long>, JpaSpecificationExecutor<Merchants> {
}