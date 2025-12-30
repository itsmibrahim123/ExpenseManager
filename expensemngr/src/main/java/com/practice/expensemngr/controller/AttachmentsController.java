package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.AttachmentsDTO;
import com.practice.expensemngr.service.AttachmentsService;
import com.practice.expensemngr.vo.AttachmentsQueryVO;
import com.practice.expensemngr.vo.AttachmentsUpdateVO;
import com.practice.expensemngr.vo.AttachmentsVO;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:3000")
@Validated
@RestController
@RequestMapping("/attachments")
public class AttachmentsController {

    @Autowired
    private AttachmentsService attachmentsService;

    @PostMapping
    public String save(@Valid @RequestBody AttachmentsVO vO) {
        return attachmentsService.save(vO).toString();
    }

    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Long id) {
        attachmentsService.delete(id);
    }

    @PutMapping("/{id}")
    public void update(@Valid @NotNull @PathVariable("id") Long id,
                       @Valid @RequestBody AttachmentsUpdateVO vO) {
        attachmentsService.update(id, vO);
    }

    @GetMapping("/{id}")
    public AttachmentsDTO getById(@Valid @NotNull @PathVariable("id") Long id) {
        return attachmentsService.getById(id);
    }

    @GetMapping
    public Page<AttachmentsDTO> query(@Valid AttachmentsQueryVO vO) {
        return attachmentsService.query(vO);
    }
}
