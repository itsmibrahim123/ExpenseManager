package com.practice.expensemngr.config;

import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private AccountsRepository accountsRepository;
    @Autowired
    private CategoriesRepository categoriesRepository;
    @Autowired
    private MerchantsRepository merchantsRepository;
    @Autowired
    private PaymentMethodsRepository paymentMethodsRepository;
    @Autowired
    private TransactionsRepository transactionsRepository;
    @Autowired
    private BudgetsRepository budgetsRepository;
    @Autowired
    private BudgetItemsRepository budgetItemsRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        if (usersRepository.existsByEmail("guest@example.com")) {
            return; // Data already exists
        }

        System.out.println("Seeding database with sample data...");

        // 1. Create Guest User
        Users guestUser = Users.builder()
                .fullName("Guest User")
                .email("guest@example.com")
                .passwordHash(passwordEncoder.encode("guest123"))
                .status("ACTIVE")
                .preferredCurrency("PKR")
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        guestUser = usersRepository.save(guestUser);
        Long userId = guestUser.getId();

        // 2. Create Accounts
        Accounts cash = createAccount(userId, "Cash Wallet", "CASH", "PKR", new BigDecimal("5000"));
        Accounts bank = createAccount(userId, "HBL Savings", "BANK", "PKR", new BigDecimal("150000"));
        Accounts credit = createAccount(userId, "Standard Chartered", "CREDIT_CARD", "PKR", new BigDecimal("0"));

        // 3. Create Categories
        Categories food = createCategory(userId, "Food & Dining", "EXPENSE");
        Categories transport = createCategory(userId, "Transportation", "EXPENSE");
        Categories utilities = createCategory(userId, "Utilities", "EXPENSE");
        Categories salary = createCategory(userId, "Salary", "INCOME");
        Categories freelance = createCategory(userId, "Freelance", "INCOME");

        // 4. Create Merchants
        Merchants uber = createMerchant(userId, "Uber");
        Merchants foodpanda = createMerchant(userId, "Foodpanda");
        Merchants daraz = createMerchant(userId, "Daraz");

        // 5. Create Payment Methods
        PaymentMethods debitCard = createPaymentMethod(userId, "Debit Card", "CARD");
        PaymentMethods cashMethod = createPaymentMethod(userId, "Cash", "CASH");

        // 6. Create Transactions
        // Income
        createTransaction(userId, bank, salary, "INCOME", new BigDecimal("250000"), "Monthly Salary", "CLEARED");
        
        // Expenses
        createTransaction(userId, cash, food, "EXPENSE", new BigDecimal("1500"), "Lunch with team", "CLEARED");
        createTransaction(userId, bank, transport, "EXPENSE", new BigDecimal("800"), "Uber to office", "CLEARED");
        createTransaction(userId, credit, utilities, "EXPENSE", new BigDecimal("12000"), "Electricity Bill", "CLEARED");
        createTransaction(userId, cash, food, "EXPENSE", new BigDecimal("4500"), "Groceries", "CLEARED");

        // 7. Create Budget
        createBudget(userId, "Monthly Expenses", "MONTHLY", new BigDecimal("50000"), Arrays.asList(food, transport));

        System.out.println("Database seeding completed.");
    }

    private Accounts createAccount(Long userId, String name, String type, String currency, BigDecimal balance) {
        return accountsRepository.save(Accounts.builder()
                .userId(userId).name(name).type(type).currencyCode(currency)
                .initialBalance(balance).currentBalance(balance)
                .archived(false).createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Categories createCategory(Long userId, String name, String type) {
        return categoriesRepository.save(Categories.builder()
                .userId(userId).name(name).type(type).sortOrder(0)
                .archived(false).createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Merchants createMerchant(Long userId, String name) {
        Merchants merchant = new Merchants();
        merchant.setUserId(userId);
        merchant.setName(name);
        merchant.setCreatedAt(new Date());
        merchant.setUpdatedAt(new Date());
        return merchantsRepository.save(merchant);
    }

    private PaymentMethods createPaymentMethod(Long userId, String name, String type) {
        PaymentMethods pm = new PaymentMethods();
        pm.setUserId(userId);
        pm.setName(name);
        pm.setType(type);
        pm.setArchived(false);
        pm.setCreatedAt(new Date());
        pm.setUpdatedAt(new Date());
        return paymentMethodsRepository.save(pm);
    }

    private void createTransaction(Long userId, Accounts account, Categories category, String type, BigDecimal amount, String desc, String status) {
        transactionsRepository.save(Transactions.builder()
                .userId(userId).accountId(account.getId()).categoryId(category.getId())
                .type(type).amount(amount).currencyCode("PKR")
                .description(desc).status(status).transactionDate(new Date())
                .recurringInstance(false)
                .createdAt(new Date()).updatedAt(new Date()).build());
        
        // Update Account Balance (simplified logic for seeder)
        if (type.equals("INCOME")) {
            account.setCurrentBalance(account.getCurrentBalance().add(amount));
        } else {
            account.setCurrentBalance(account.getCurrentBalance().subtract(amount));
        }
        accountsRepository.save(account);
    }

    private void createBudget(Long userId, String name, String period, BigDecimal totalLimit, List<Categories> categories) {
        // Calculate end date (30 days from now)
        Date startDate = new Date();
        Date endDate = new Date(startDate.getTime() + (30L * 24 * 60 * 60 * 1000));

        Budgets budget = budgetsRepository.save(Budgets.builder()
                .userId(userId).name(name).periodType(period).totalLimit(totalLimit)
                .startDate(startDate).endDate(endDate)
                .createdAt(new Date()).updatedAt(new Date()).build());

        for (Categories cat : categories) {
            budgetItemsRepository.save(BudgetItems.builder()
                    .budgetId(budget.getId()).categoryId(cat.getId())
                    .limitAmount(new BigDecimal("10000"))
                    .build());
        }
    }
}
