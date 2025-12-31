package com.practice.expensemngr.repository;

import com.practice.expensemngr.entity.Attachments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AttachmentsRepository extends JpaRepository<Attachments, Long>, JpaSpecificationExecutor<Attachments> {

    List<Attachments> findByTransactionId(Long transactionId);
}