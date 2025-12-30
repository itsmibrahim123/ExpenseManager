package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.AuditLogsDTO;
import com.practice.expensemngr.service.AuditLogsService;
import com.practice.expensemngr.vo.AuditLogsQueryVO;
import com.practice.expensemngr.vo.AuditLogsUpdateVO;
import com.practice.expensemngr.vo.AuditLogsVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/auditLogs")
public class AuditLogsController {

    @Autowired
    private AuditLogsService auditLogsService;

    @PostMapping
    public String save(@Valid @RequestBody AuditLogsVO vO) {
        return auditLogsService.save(vO).toString();
    }

    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Long id) {
        auditLogsService.delete(id);
    }

    @PutMapping("/{id}")
    public void update(@Valid @NotNull @PathVariable("id") Long id,
                       @Valid @RequestBody AuditLogsUpdateVO vO) {
        auditLogsService.update(id, vO);
    }

    @GetMapping("/{id}")
    public AuditLogsDTO getById(@Valid @NotNull @PathVariable("id") Long id) {
        return auditLogsService.getById(id);
    }

    @GetMapping
    public Page<AuditLogsDTO> query(@Valid AuditLogsQueryVO vO) {
        return auditLogsService.query(vO);
    }
}
