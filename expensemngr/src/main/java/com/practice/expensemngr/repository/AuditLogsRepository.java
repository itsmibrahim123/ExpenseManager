package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.AuditLogs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogsRepository extends JpaRepository<AuditLogs, Long>, JpaSpecificationExecutor<AuditLogs> {

}