package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.AccountCreateRequestDTO;
import com.practice.expensemngr.dto.AccountResponseDTO;
import com.practice.expensemngr.dto.AccountUpdateRequestDTO;
import com.practice.expensemngr.entity.Accounts;
import com.practice.expensemngr.exception.AccountHasBalanceException;
import com.practice.expensemngr.exception.AccountHasTransactionsException;
import com.practice.expensemngr.exception.AccountNotFoundException;
import com.practice.expensemngr.repository.AccountsRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountsService {

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    /**
     * Create a new account
     * @param request Account creation data
     * @return Created account details
     */
    @Transactional
    public AccountResponseDTO createAccount(AccountCreateRequestDTO request) {
        // Create new account entity
        Accounts account = Accounts.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .type(request.getType())
                .currencyCode(request.getCurrencyCode().toUpperCase())
                .initialBalance(request.getInitialBalance())
                .currentBalance(request.getInitialBalance()) // Current balance = initial balance on creation
                .archived(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        account = accountsRepository.save(account);

        return toResponseDTO(account);
    }

    /**
     * Get all accounts for a user
     * @param userId User ID
     * @param includeArchived Whether to include archived accounts
     * @return List of account details
     */
    public List<AccountResponseDTO> getAccountsByUser(Long userId, boolean includeArchived) {
        List<Accounts> accounts;

        if (includeArchived) {
            accounts = accountsRepository.findAll().stream()
                    .filter(acc -> acc.getUserId().equals(userId))
                    .collect(Collectors.toList());
        } else {
            accounts = accountsRepository.findAll().stream()
                    .filter(acc -> acc.getUserId().equals(userId) && !acc.getArchived())
                    .collect(Collectors.toList());
        }

        return accounts.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single account by ID
     * @param accountId Account ID
     * @return Account details
     * @throws AccountNotFoundException if account not found
     */
    public AccountResponseDTO getAccountById(Long accountId) {
        Accounts account = accountsRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        return toResponseDTO(account);
    }

    /**
     * Update account details
     * @param accountId Account ID to update
     * @param request Update data
     * @return Updated account details
     * @throws AccountNotFoundException if account not found
     * @throws AccountHasTransactionsException if trying to change currency on account with transactions
     */
    @Transactional
    public AccountResponseDTO updateAccount(Long accountId, AccountUpdateRequestDTO request) {
        Accounts account = accountsRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        // Check if currency is being changed
        if (request.getCurrencyCode() != null &&
                !request.getCurrencyCode().equalsIgnoreCase(account.getCurrencyCode())) {
            // Check if account has transactions
            if (transactionsRepository.existsByAccountId(accountId)) {
                throw new AccountHasTransactionsException();
            }
            account.setCurrencyCode(request.getCurrencyCode().toUpperCase());
        }

        // Update allowed fields
        account.setName(request.getName());
        account.setType(request.getType());
        account.setUpdatedAt(new Date());

        account = accountsRepository.save(account);

        return toResponseDTO(account);
    }

    /**
     * Archive an account
     * @param accountId Account ID to archive
     * @param force Whether to force archival even with non-zero balance
     * @return Success message
     * @throws AccountNotFoundException if account not found
     * @throws AccountHasBalanceException if account has non-zero balance and force=false
     */
    @Transactional
    public String archiveAccount(Long accountId, boolean force) {
        Accounts account = accountsRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        // Check if account has non-zero balance
        if (!force && account.getCurrentBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new AccountHasBalanceException(account.getCurrentBalance());
        }

        // Archive the account
        account.setArchived(true);
        account.setUpdatedAt(new Date());
        accountsRepository.save(account);

        return "Account archived successfully";
    }

    /**
     * Convert entity to response DTO
     */
    private AccountResponseDTO toResponseDTO(Accounts account) {
        return AccountResponseDTO.builder()
                .id(account.getId())
                .userId(account.getUserId())
                .name(account.getName())
                .type(account.getType())
                .currencyCode(account.getCurrencyCode())
                .initialBalance(account.getInitialBalance())
                .currentBalance(account.getCurrentBalance())
                .archived(account.getArchived())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }

    /**
     * Update account balance
     * @param accountId Account ID
     * @param amount Amount to add (positive) or subtract (negative)
     */
    @Transactional
    public void updateAccountBalance(Long accountId, BigDecimal amount) {
        Accounts account = accountsRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        BigDecimal newBalance = account.getCurrentBalance().add(amount);
        account.setCurrentBalance(newBalance);
        account.setUpdatedAt(new Date());

        accountsRepository.save(account);
    }
}