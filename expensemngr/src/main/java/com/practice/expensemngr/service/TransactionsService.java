package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.TransactionCreateRequestDTO;
import io.saadmughal.assignment05.dto.TransactionResponseDTO;
import io.saadmughal.assignment05.entity.Accounts;
import io.saadmughal.assignment05.entity.Categories;
import io.saadmughal.assignment05.entity.Transactions;
import io.saadmughal.assignment05.exception.*;
import io.saadmughal.assignment05.repository.AccountsRepository;
import io.saadmughal.assignment05.repository.CategoriesRepository;
import io.saadmughal.assignment05.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.saadmughal.assignment05.dto.TransferRequestDTO;
import io.saadmughal.assignment05.dto.TransferResponseDTO;
import io.saadmughal.assignment05.exception.ArchivedAccountException;
import io.saadmughal.assignment05.exception.CurrencyMismatchException;
import io.saadmughal.assignment05.exception.SameAccountTransferException;

import java.math.BigDecimal;
import java.sql.Time;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionsService {

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private AccountsService accountsService;

    /**
     * Create a new transaction (expense or income)
     * @param request Transaction creation data
     * @param allowNegative Allow negative balance for expenses
     * @return Created transaction details
     */
    @Transactional
    public TransactionResponseDTO createTransaction(TransactionCreateRequestDTO request, boolean allowNegative) {
        // 1. Validate amount
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidAmountException();
        }

        // 2. Validate transaction type
        if (!request.getType().equals("EXPENSE") && !request.getType().equals("INCOME")) {
            throw new InvalidTransactionTypeException(request.getType());
        }

        // 3. Validate account exists and belongs to user
        Accounts account = accountsRepository.findById(request.getAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getAccountId()));

        if (!account.getUserId().equals(request.getUserId())) {
            throw new AccountNotFoundException(request.getAccountId());
        }

        // 4. Validate category exists and type matches
        Categories category = categoriesRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));

        if (!category.getType().equalsIgnoreCase(request.getType())) {
            throw new CategoryTypeMismatchException(request.getType(), category.getType());
        }

        // 5. Check balance for expenses (if status is CLEARED)
        if (request.getType().equals("EXPENSE") && request.getStatus().equals("CLEARED")) {
            BigDecimal newBalance = account.getCurrentBalance().subtract(request.getAmount());
            if (!allowNegative && newBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientBalanceException(account.getCurrentBalance(), request.getAmount());
            }
        }

        // 6. Set transaction time to now if not provided
        Time transactionTime = request.getTransactionTime();
        if (transactionTime == null) {
            transactionTime = new Time(System.currentTimeMillis());
        }

        // 7. Create transaction entity
        Transactions transaction = Transactions.builder()
                .userId(request.getUserId())
                .accountId(request.getAccountId())
                .categoryId(request.getCategoryId())
                .paymentMethodId(request.getPaymentMethodId())
                .merchantId(request.getMerchantId())
                .type(request.getType())
                .amount(request.getAmount())
                .currencyCode(request.getCurrencyCode().toUpperCase())
                .transactionDate(request.getTransactionDate())
                .transactionTime(transactionTime)
                .status(request.getStatus())
                .referenceNumber(request.getReferenceNumber())
                .description(request.getDescription())
                .recurringInstance(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        transaction = transactionsRepository.save(transaction);

        // 8. Update account balance if status is CLEARED
        if (request.getStatus().equals("CLEARED")) {
            BigDecimal balanceChange;
            if (request.getType().equals("EXPENSE")) {
                balanceChange = request.getAmount().negate(); // Subtract for expense
            } else {
                balanceChange = request.getAmount(); // Add for income
            }
            accountsService.updateAccountBalance(request.getAccountId(), balanceChange);
        }

        // 9. Fetch updated account balance
        account = accountsRepository.findById(request.getAccountId()).get();

        // 10. Build and return response
        return toResponseDTO(transaction, account, category);
    }

    /**
     * Get all transactions for a user
     * @param userId User ID
     * @param accountId Optional account filter
     * @return List of transactions
     */
    public List<TransactionResponseDTO> getTransactionsByUser(Long userId, Long accountId) {
        List<Transactions> transactions;

        if (accountId != null) {
            // Filter by account
            transactions = transactionsRepository.findAll().stream()
                    .filter(t -> t.getUserId().equals(userId) && t.getAccountId().equals(accountId))
                    .collect(Collectors.toList());
        } else {
            // All user transactions
            transactions = transactionsRepository.findAll().stream()
                    .filter(t -> t.getUserId().equals(userId))
                    .collect(Collectors.toList());
        }

        return transactions.stream()
                .map(t -> {
                    Accounts acc = accountsRepository.findById(t.getAccountId()).orElse(null);
                    Categories cat = categoriesRepository.findById(t.getCategoryId()).orElse(null);
                    return toResponseDTO(t, acc, cat);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get single transaction by ID
     * @param transactionId Transaction ID
     * @return Transaction details
     */
    public TransactionResponseDTO getTransactionById(Long transactionId) {
        Transactions transaction = transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        Accounts account = accountsRepository.findById(transaction.getAccountId()).orElse(null);
        Categories category = categoriesRepository.findById(transaction.getCategoryId()).orElse(null);

        return toResponseDTO(transaction, account, category);
    }

    /**
     * Update transaction status (PENDING → CLEARED)
     * @param transactionId Transaction ID
     * @param newStatus New status
     * @return Updated transaction
     */
    @Transactional
    public TransactionResponseDTO updateTransactionStatus(Long transactionId, String newStatus) {
        Transactions transaction = transactionsRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // Only allow PENDING → CLEARED transition
        if (transaction.getStatus().equals("PENDING") && newStatus.equals("CLEARED")) {
            // Update balance now
            BigDecimal balanceChange;
            if (transaction.getType().equals("EXPENSE")) {
                balanceChange = transaction.getAmount().negate();
            } else {
                balanceChange = transaction.getAmount();
            }
            accountsService.updateAccountBalance(transaction.getAccountId(), balanceChange);

            transaction.setStatus(newStatus);
            transaction.setUpdatedAt(new Date());
            transaction = transactionsRepository.save(transaction);
        }

        Accounts account = accountsRepository.findById(transaction.getAccountId()).orElse(null);
        Categories category = categoriesRepository.findById(transaction.getCategoryId()).orElse(null);

        return toResponseDTO(transaction, account, category);
    }

    /**
     * Convert entity to response DTO
     */
    private TransactionResponseDTO toResponseDTO(Transactions transaction, Accounts account, Categories category) {
        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .userId(transaction.getUserId())
                .accountId(transaction.getAccountId())
                .categoryId(transaction.getCategoryId())
                .paymentMethodId(transaction.getPaymentMethodId())
                .merchantId(transaction.getMerchantId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .transactionDate(transaction.getTransactionDate())
                .transactionTime(transaction.getTransactionTime())
                .status(transaction.getStatus())
                .referenceNumber(transaction.getReferenceNumber())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .accountName(account != null ? account.getName() : null)
                .categoryName(category != null ? category.getName() : null)
                .accountBalanceAfter(account != null ? account.getCurrentBalance() : null)
                .build();
    }

    /**
     * Transfer funds between two accounts
     * @param request Transfer request data
     * @param allowNegative Allow negative balance in source account
     * @return Transfer response with both transaction details
     */
    @Transactional
    public TransferResponseDTO transferFunds(TransferRequestDTO request, boolean allowNegative) {
        // 1. Validate amount
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidAmountException();
        }

        // 2. Validate source and destination are different
        if (request.getSourceAccountId().equals(request.getDestinationAccountId())) {
            throw new SameAccountTransferException();
        }

        // 3. Fetch source account
        Accounts sourceAccount = accountsRepository.findById(request.getSourceAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getSourceAccountId()));

        // 4. Fetch destination account
        Accounts destinationAccount = accountsRepository.findById(request.getDestinationAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getDestinationAccountId()));

        // 5. Verify both accounts belong to the user
        if (!sourceAccount.getUserId().equals(request.getUserId())) {
            throw new AccountNotFoundException(request.getSourceAccountId());
        }
        if (!destinationAccount.getUserId().equals(request.getUserId())) {
            throw new AccountNotFoundException(request.getDestinationAccountId());
        }

        // 6. Check if accounts are archived
        if (sourceAccount.getArchived()) {
            throw new ArchivedAccountException(sourceAccount.getName());
        }
        if (destinationAccount.getArchived()) {
            throw new ArchivedAccountException(destinationAccount.getName());
        }

        // 7. Validate same currency
        if (!sourceAccount.getCurrencyCode().equals(destinationAccount.getCurrencyCode())) {
            throw new CurrencyMismatchException(sourceAccount.getCurrencyCode(), destinationAccount.getCurrencyCode());
        }

        // 8. Check source account balance
        BigDecimal sourceBalanceBefore = sourceAccount.getCurrentBalance();
        BigDecimal newSourceBalance = sourceBalanceBefore.subtract(request.getAmount());

        if (!allowNegative && newSourceBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientBalanceException(sourceBalanceBefore, request.getAmount());
        }

        // 9. Get Transfer category (ID 3, created during registration)
        Long transferCategoryId = 3L; // Default Transfer category
        Categories transferCategory = categoriesRepository.findById(transferCategoryId).orElse(null);

        // If Transfer category doesn't exist, use first available category
        if (transferCategory == null) {
            transferCategory = categoriesRepository.findAll().stream()
                    .filter(c -> c.getType().equals("TRANSFER"))
                    .findFirst()
                    .orElse(null);
            if (transferCategory != null) {
                transferCategoryId = transferCategory.getId();
            }
        }

        // 10. Store balances before transfer
        BigDecimal destinationBalanceBefore = destinationAccount.getCurrentBalance();

        // 11. Create TRANSFER transaction for source account (outgoing)
        Transactions transferOut = Transactions.builder()
                .userId(request.getUserId())
                .accountId(request.getSourceAccountId())
                .categoryId(transferCategoryId)
                .type("TRANSFER")
                .amount(request.getAmount())
                .currencyCode(sourceAccount.getCurrencyCode())
                .transactionDate(request.getTransferDate())
                .transactionTime(new Time(System.currentTimeMillis()))
                .status("CLEARED")
                .referenceNumber(request.getReferenceNumber())
                .description(request.getDescription() != null ?
                        request.getDescription() :
                        "Transfer to " + destinationAccount.getName())
                .recurringInstance(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        transferOut = transactionsRepository.save(transferOut);

        // 12. Create TRANSFER transaction for destination account (incoming)
        Transactions transferIn = Transactions.builder()
                .userId(request.getUserId())
                .accountId(request.getDestinationAccountId())
                .categoryId(transferCategoryId)
                .type("TRANSFER")
                .amount(request.getAmount())
                .currencyCode(destinationAccount.getCurrencyCode())
                .transactionDate(request.getTransferDate())
                .transactionTime(new Time(System.currentTimeMillis()))
                .status("CLEARED")
                .referenceNumber(request.getReferenceNumber())
                .description(request.getDescription() != null ?
                        request.getDescription() :
                        "Transfer from " + sourceAccount.getName())
                .recurringInstance(false)
                .linkedTransactionId(transferOut.getId()) // Link to transferOut
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        transferIn = transactionsRepository.save(transferIn);

        // 13. Update transferOut with linked transaction ID
        transferOut.setLinkedTransactionId(transferIn.getId());
        transferOut = transactionsRepository.save(transferOut);

        // 14. Update source account balance (decrease)
        accountsService.updateAccountBalance(request.getSourceAccountId(), request.getAmount().negate());

        // 15. Update destination account balance (increase)
        accountsService.updateAccountBalance(request.getDestinationAccountId(), request.getAmount());

        // 16. Fetch updated balances
        sourceAccount = accountsRepository.findById(request.getSourceAccountId()).get();
        destinationAccount = accountsRepository.findById(request.getDestinationAccountId()).get();

        // 17. Build and return response
        return TransferResponseDTO.builder()
                .transferOutTransactionId(transferOut.getId())
                .transferInTransactionId(transferIn.getId())
                .sourceAccountId(sourceAccount.getId())
                .sourceAccountName(sourceAccount.getName())
                .sourceBalanceBefore(sourceBalanceBefore)
                .sourceBalanceAfter(sourceAccount.getCurrentBalance())
                .destinationAccountId(destinationAccount.getId())
                .destinationAccountName(destinationAccount.getName())
                .destinationBalanceBefore(destinationBalanceBefore)
                .destinationBalanceAfter(destinationAccount.getCurrentBalance())
                .amount(request.getAmount())
                .currencyCode(sourceAccount.getCurrencyCode())
                .transferDate(request.getTransferDate())
                .description(request.getDescription())
                .message("Transfer completed successfully")
                .build();
    }
}