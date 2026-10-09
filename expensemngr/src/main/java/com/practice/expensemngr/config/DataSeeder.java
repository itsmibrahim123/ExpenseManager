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
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CustomerRepository customerRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        if (usersRepository.existsByEmail("guest@example.com")) {
            seedInventoryAndCustomersIfMissing();
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
        Accounts cash = createAccount(userId, "Cash Drawer", "CASH", "PKR", new BigDecimal("50000"));
        Accounts bank = createAccount(userId, "HBL Business Account", "BANK", "PKR", new BigDecimal("250000"));
        Accounts credit = createAccount(userId, "Standard Chartered", "CREDIT_CARD", "PKR", new BigDecimal("0"));

        // 3. Create Categories
        Categories food = createCategory(userId, "Food & Dining", "EXPENSE");
        Categories transport = createCategory(userId, "Transportation", "EXPENSE");
        Categories utilities = createCategory(userId, "Utilities", "EXPENSE");
        Categories salary = createCategory(userId, "Salary", "INCOME");
        Categories posSales = createCategory(userId, "POS Retail Sales", "INCOME");

        // 4. Create Merchants
        Merchants uber = createMerchant(userId, "Uber");
        Merchants foodpanda = createMerchant(userId, "Foodpanda");
        Merchants daraz = createMerchant(userId, "Daraz");

        // 5. Create Payment Methods
        PaymentMethods debitCard = createPaymentMethod(userId, "Debit Card", "CARD");
        PaymentMethods cashMethod = createPaymentMethod(userId, "Cash", "CASH");

        // 6. Create Transactions
        createTransaction(userId, bank, salary, "INCOME", new BigDecimal("250000"), "Monthly Salary", "CLEARED");
        createTransaction(userId, cash, food, "EXPENSE", new BigDecimal("1500"), "Lunch with team", "CLEARED");

        // 7. Create Budget
        createBudget(userId, "Monthly Expenses", "MONTHLY", new BigDecimal("50000"), Arrays.asList(food, transport));

        seedInventoryAndCustomersIfMissing();

        System.out.println("Database seeding completed.");
    }

    private void seedInventoryAndCustomersIfMissing() {
        if (productRepository.count() == 0) {
            System.out.println("Seeding sample products...");
            createProduct("SKU-1001", "890123456701", "Wireless Optical Mouse", "2.4GHz Ergonomic Mouse", new BigDecimal("800"), new BigDecimal("1500"), 45, 10, "PCS");
            createProduct("SKU-1002", "890123456702", "Mechanical Gaming Keyboard", "RGB Backlit Blue Switches", new BigDecimal("3500"), new BigDecimal("6500"), 20, 5, "PCS");
            createProduct("SKU-1003", "890123456703", "USB-C Fast Charging Cable", "2-Meter Braided Nylon Cable", new BigDecimal("250"), new BigDecimal("600"), 100, 15, "PCS");
            createProduct("SKU-1004", "890123456704", "Full HD 1080p Webcam", "Built-in Noise Cancelling Mic", new BigDecimal("2200"), new BigDecimal("4200"), 8, 10, "PCS"); // Low stock
            createProduct("SKU-1005", "890123456705", "Portable Power Bank 20000mAh", "Dual USB Fast Charge", new BigDecimal("2800"), new BigDecimal("4900"), 3, 5, "PCS"); // Low stock
        }

        if (customerRepository.count() == 0) {
            System.out.println("Seeding sample customers...");
            createCustomer("Walk-in Customer", "000-000-0000", "walkin@store.com", "Main Retail Counter");
            createCustomer("Ali Ahmed", "+92-300-1234567", "ali.ahmed@example.com", "House #45, Street 12, Lahore");
            createCustomer("Sara Khan", "+92-321-9876543", "sara.k@example.com", "Suite 4B, Plaza Center, Karachi");
        }
    }

    private Product createProduct(String sku, String barcode, String name, String desc, BigDecimal cost, BigDecimal selling, int stock, int reorder, String unit) {
        return productRepository.save(Product.builder()
                .sku(sku).barcode(barcode).name(name).description(desc)
                .costPrice(cost).sellingPrice(selling).currentStock(stock)
                .reorderLevel(reorder).unit(unit).active(true)
                .createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Customer createCustomer(String name, String phone, String email, String address) {
        return customerRepository.save(Customer.builder()
                .name(name).phone(phone).email(email).address(address)
                .currentCreditBalance(BigDecimal.ZERO)
                .createdAt(new Date()).updatedAt(new Date()).build());
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
        
        if (type.equals("INCOME")) {
            account.setCurrentBalance(account.getCurrentBalance().add(amount));
        } else {
            account.setCurrentBalance(account.getCurrentBalance().subtract(amount));
        }
        accountsRepository.save(account);
    }

    private void createBudget(Long userId, String name, String period, BigDecimal totalLimit, List<Categories> categories) {
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
