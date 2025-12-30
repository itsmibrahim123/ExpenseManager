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

    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Long id) {
        transactionTagsService.delete(id);
    }

    @PutMapping("/{id}")
    public void update(@Valid @NotNull @PathVariable("id") Long id,
                       @Valid @RequestBody TransactionTagsUpdateVO vO) {
        transactionTagsService.update(id, vO);
    }

    @GetMapping("/{id}")
    public TransactionTagsDTO getById(@Valid @NotNull @PathVariable("id") Long id) {
        return transactionTagsService.getById(id);
    }

    @GetMapping
    public Page<TransactionTagsDTO> query(@Valid TransactionTagsQueryVO vO) {
        return transactionTagsService.query(vO);
    }
}
