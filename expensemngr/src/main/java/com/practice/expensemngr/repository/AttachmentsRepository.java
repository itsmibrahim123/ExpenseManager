package io.saadmughal.assignment05.repository;

import io.saadmughal.assignment05.entity.Attachments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AttachmentsRepository extends JpaRepository<Attachments, Long>, JpaSpecificationExecutor<Attachments> {

    List<Attachments> findByTransactionId(Long transactionId);
}