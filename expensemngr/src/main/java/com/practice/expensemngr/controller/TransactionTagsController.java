package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.TransactionTagsDTO;
import com.practice.expensemngr.service.TransactionTagsService;
import com.practice.expensemngr.vo.TransactionTagsQueryVO;
import com.practice.expensemngr.vo.TransactionTagsUpdateVO;
import com.practice.expensemngr.vo.TransactionTagsVO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.PutMapping;
@CrossOrigin(origins = "http://localhost:3000")
@Validated
@RestController
@RequestMapping("/transactionTags")
public class TransactionTagsController {

    @Autowired
    private TransactionTagsService transactionTagsService;

    @PostMapping
    public String save(@Valid @RequestBody TransactionTagsVO vO) {
        return transactionTagsService.save(vO).toString();
    }

    @DeleteMapping("/{transactionId}/{tagId}")
    public void delete(@PathVariable("transactionId") Long transactionId, @PathVariable("tagId") Long tagId) {
        transactionTagsService.delete(transactionId, tagId);
    }

    @PutMapping("/{transactionId}/{tagId}")
    public void update(@PathVariable("transactionId") Long transactionId, @PathVariable("tagId") Long tagId,
                       @Valid @RequestBody TransactionTagsUpdateVO vO) {
        transactionTagsService.update(transactionId, tagId, vO);
    }

    @GetMapping("/{transactionId}/{tagId}")
    public TransactionTagsDTO getById(@PathVariable("transactionId") Long transactionId, @PathVariable("tagId") Long tagId) {
        return transactionTagsService.getById(transactionId, tagId);
    }

    @GetMapping
    public Page<TransactionTagsDTO> query(@Valid TransactionTagsQueryVO vO) {
        return transactionTagsService.query(vO);
    }
}
