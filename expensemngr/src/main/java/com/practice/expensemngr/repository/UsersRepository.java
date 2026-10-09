package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long>, JpaSpecificationExecutor<Users> {

    boolean existsByEmail(String email);

    Optional<Users> findByEmail(String email);

    List<Users> findByTenantId(UUID tenantId);
}