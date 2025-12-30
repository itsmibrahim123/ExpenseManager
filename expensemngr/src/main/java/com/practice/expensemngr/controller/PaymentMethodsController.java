package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.PaymentMethodsDTO;
import com.practice.expensemngr.service.PaymentMethodsService;
import com.practice.expensemngr.vo.PaymentMethodsQueryVO;
import com.practice.expensemngr.vo.PaymentMethodsUpdateVO;
import com.practice.expensemngr.vo.PaymentMethodsVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/paymentMethods")
public class PaymentMethodsController {

    @Autowired
    private PaymentMethodsService paymentMethodsService;

    @PostMapping
    public String save(@Valid @RequestBody PaymentMethodsVO vO) {
        return paymentMethodsService.save(vO).toString();
    }

    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Long id) {
        paymentMethodsService.delete(id);
    }

    @PutMapping("/{id}")
    public void update(@Valid @NotNull @PathVariable("id") Long id,
                       @Valid @RequestBody PaymentMethodsUpdateVO vO) {
        paymentMethodsService.update(id, vO);
    }

    @GetMapping("/{id}")
    public PaymentMethodsDTO getById(@Valid @NotNull @PathVariable("id") Long id) {
        return paymentMethodsService.getById(id);
    }

    @GetMapping
    public Page<PaymentMethodsDTO> query(@Valid PaymentMethodsQueryVO vO) {
        return paymentMethodsService.query(vO);
    }
}
