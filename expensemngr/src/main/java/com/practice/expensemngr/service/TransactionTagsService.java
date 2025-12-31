package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.TransactionTagsDTO;
import com.practice.expensemngr.entity.TransactionTags;
import com.practice.expensemngr.entity.TransactionTagsId;
import com.practice.expensemngr.repository.TransactionTagsRepository;
import com.practice.expensemngr.vo.TransactionTagsQueryVO;
import com.practice.expensemngr.vo.TransactionTagsUpdateVO;
import com.practice.expensemngr.vo.TransactionTagsVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class TransactionTagsService {

    @Autowired
    private TransactionTagsRepository transactionTagsRepository;

    public Long save(TransactionTagsVO vO) {
        TransactionTags bean = new TransactionTags();
        BeanUtils.copyProperties(vO, bean);
        bean = transactionTagsRepository.save(bean);
        return bean.getTransactionId();
    }

    public void delete(Long transactionId, Long tagId) {
        TransactionTagsId id = new TransactionTagsId(transactionId, tagId);
        transactionTagsRepository.deleteById(id);
    }

    public void update(Long transactionId, Long tagId, TransactionTagsUpdateVO vO) {
        TransactionTags bean = requireOne(transactionId, tagId);
        BeanUtils.copyProperties(vO, bean);
        transactionTagsRepository.save(bean);
    }

    public TransactionTagsDTO getById(Long transactionId, Long tagId) {
        TransactionTags original = requireOne(transactionId, tagId);
        return toDTO(original);
    }

    public Page<TransactionTagsDTO> query(TransactionTagsQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    private TransactionTagsDTO toDTO(TransactionTags original) {
        TransactionTagsDTO bean = new TransactionTagsDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private TransactionTags requireOne(Long transactionId, Long tagId) {
        TransactionTagsId id = new TransactionTagsId(transactionId, tagId);
        return transactionTagsRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
