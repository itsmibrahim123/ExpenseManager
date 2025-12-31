package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Categories;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CategoriesRepository extends JpaRepository<Categories, Long>, JpaSpecificationExecutor<Categories> {

    /**
     * Find category by ID
     * @param id Category ID
     * @return Optional containing category if found
     */
    Optional<Categories> findById(Long id);

    List<Categories> findByUserIdOrUserIdIsNull(@NotNull(message = "User ID is required") Long userId);
}