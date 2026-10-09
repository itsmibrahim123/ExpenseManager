package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.PlanTier;
import com.practice.expensemngr.entity.Tenant;
import com.practice.expensemngr.entity.TenantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByContactEmail(String contactEmail);

    @Query("SELECT t FROM Tenant t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:planTier IS NULL OR t.planTier = :planTier) AND " +
           "(:query IS NULL OR LOWER(t.storeName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.slug) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.contactEmail) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Tenant> searchTenants(
            @Param("status") TenantStatus status,
            @Param("planTier") PlanTier planTier,
            @Param("query") String query,
            Pageable pageable
    );

    long countByStatus(TenantStatus status);

    long countByCreatedAtAfter(Instant date);
}
