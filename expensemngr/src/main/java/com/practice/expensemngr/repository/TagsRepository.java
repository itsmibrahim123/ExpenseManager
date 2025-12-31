package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface TagsRepository extends JpaRepository<Tags, Long>, JpaSpecificationExecutor<Tags> {

    /**
     * Find all tags for a specific user
     * @param userId User ID
     * @return List of tags
     */
    List<Tags> findByUserId(Long userId);

    /**
     * Find tag by user and name (for duplicate check)
     * @param userId User ID
     * @param name Tag name
     * @return Optional tag
     */
    Optional<Tags> findByUserIdAndName(Long userId, String name);

    /**
     * Check if tag exists for user with given name
     * @param userId User ID
     * @param name Tag name
     * @return true if exists
     */
    boolean existsByUserIdAndName(Long userId, String name);

    /**
     * Find all tags for a user, ordered by name
     * @param userId User ID
     * @return List of tags
     */
    List<Tags> findByUserIdOrderByNameAsc(Long userId);
}