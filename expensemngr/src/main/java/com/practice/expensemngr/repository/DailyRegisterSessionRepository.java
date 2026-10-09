package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.DailyRegisterSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyRegisterSessionRepository extends JpaRepository<DailyRegisterSession, Long> {

    Optional<DailyRegisterSession> findFirstByUserIdAndStatusOrderByOpenedAtDesc(Long userId, String status);

    List<DailyRegisterSession> findByOpenedAtBetweenOrderByOpenedAtDesc(Date startDate, Date endDate);

    @Query("SELECT d FROM DailyRegisterSession d WHERE d.openedAt >= :startDate AND d.openedAt <= :endDate ORDER BY d.openedAt DESC")
    List<DailyRegisterSession> findSessionsForDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
}
