package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.AccountCreateRequestDTO;
import com.practice.expensemngr.dto.AccountResponseDTO;
import com.practice.expensemngr.dto.AccountUpdateRequestDTO;
import com.practice.expensemngr.service.AccountsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/accounts")
public class AccountsController {

    @Autowired
    private AccountsService accountsService;

    /**
     * Create a new account
     * @param request Account creation data
     * @return Created account details
     */
    @PostMapping
    public ResponseEntity<AccountResponseDTO> createAccount(@Valid @RequestBody AccountCreateRequestDTO request) {
        AccountResponseDTO response = accountsService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all accounts for a user
     * @param userId User ID
     * @param includeArchived Whether to include archived accounts (default: false)
     * @return List of accounts
     */
    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getAccounts(
            @RequestParam @NotNull Long userId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        List<AccountResponseDTO> accounts = accountsService.getAccountsByUser(userId, includeArchived);
        return ResponseEntity.ok(accounts);
    }

    /**
     * Get single account by ID
     * @param id Account ID
     * @return Account details
     */
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> getAccountById(@PathVariable @NotNull Long id) {
        AccountResponseDTO account = accountsService.getAccountById(id);
        return ResponseEntity.ok(account);
    }

    /**
     * Update account details
     * @param id Account ID
     * @param request Update data
     * @return Updated account details
     */
    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> updateAccount(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody AccountUpdateRequestDTO request) {
        AccountResponseDTO account = accountsService.updateAccount(id, request);
        return ResponseEntity.ok(account);
    }

    /**
     * Archive an account
     * @param id Account ID
     * @param force Force archival even with non-zero balance (default: false)
     * @return Success message
     */
    @DeleteMapping("/{id}/archive")
    public ResponseEntity<Map<String, String>> archiveAccount(
            @PathVariable @NotNull Long id,
            @RequestParam(defaultValue = "false") boolean force) {
        String message = accountsService.archiveAccount(id, force);

        Map<String, String> response = new HashMap<>();
        response.put("message", message);

        return ResponseEntity.ok(response);
    }
}