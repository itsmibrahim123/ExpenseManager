package com.practice.expensemngr.config;

import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private TenantRepository tenantRepository;
    @Autowired
    private TenantSettingsRepository tenantSettingsRepository;
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
        System.out.println("Initializing SaaS Multi-Tenant Seeder...");

        // 1. Seed Super Admin User if missing
        if (!usersRepository.existsByEmail("admin@saas.com")) {
            Users superAdmin = Users.builder()
                    .fullName("Super Admin")
                    .email("admin@saas.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(UserRole.ROLE_SUPER_ADMIN)
                    .userStatus(UserStatus.ACTIVE)
                    .status("ACTIVE")
                    .preferredCurrency("PKR")
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();
            usersRepository.save(superAdmin);
            System.out.println("Seeded Super Admin user: admin@saas.com / admin123");
        }

        // 2. Seed Default Tenant & Store Data if missing
        if (!tenantRepository.existsBySlug("main-store")) {
            Tenant defaultTenant = Tenant.builder()
                    .storeName("Main Retail Store")
                    .slug("main-store")
                    .contactEmail("guest@example.com")
                    .contactPhone("+92-300-1112233")
                    .currencyCode("PKR")
                    .status(TenantStatus.ACTIVE)
                    .planTier(PlanTier.ENTERPRISE)
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .build();

            defaultTenant = tenantRepository.save(defaultTenant);
            UUID tenantId = defaultTenant.getId();

            TenantSettings settings = TenantSettings.builder()
                    .tenantId(tenantId)
                    .taxNumber("TAX-MAIN-8899")
                    .taxRateDefault(new BigDecimal("5.0"))
                    .receiptHeader("MAIN RETAIL STORE\nPlaza Center, Commercial Market, Lahore")
                    .receiptFooter("Thank you for shopping at Main Retail Store!\nReturns valid for 7 days with thermal receipt.")
                    .allowNegativeStock(false)
                    .build();
            tenantSettingsRepository.save(settings);

            // Create Store Admin User
            Users storeAdmin = Users.builder()
                    .tenantId(tenantId)
                    .fullName("Guest Store Admin")
                    .email("guest@example.com")
                    .passwordHash(passwordEncoder.encode("guest123"))
                    .role(UserRole.ROLE_STORE_ADMIN)
                    .userStatus(UserStatus.ACTIVE)
                    .status("ACTIVE")
                    .preferredCurrency("PKR")
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();
            storeAdmin = usersRepository.save(storeAdmin);
            Long userId = storeAdmin.getId();

            // Seed Accounts for Tenant
            Accounts cash = createAccount(tenantId, userId, "Cash Drawer", "CASH", "PKR", new BigDecimal("50000"));
            Accounts bank = createAccount(tenantId, userId, "HBL Business Account", "BANK", "PKR", new BigDecimal("250000"));
            Accounts credit = createAccount(tenantId, userId, "Standard Chartered", "CREDIT_CARD", "PKR", new BigDecimal("0"));

            // Seed Categories for Tenant
            Categories food = createCategory(tenantId, userId, "Food & Dining", "EXPENSE");
            Categories transport = createCategory(tenantId, userId, "Transportation", "EXPENSE");
            Categories utilities = createCategory(tenantId, userId, "Utilities", "EXPENSE");
            Categories salary = createCategory(tenantId, userId, "Salary", "INCOME");
            Categories posSales = createCategory(tenantId, userId, "POS Retail Sales", "INCOME");

            // Seed Merchants & Payment Methods
            createMerchant(userId, "Uber");
            createMerchant(userId, "Foodpanda");
            createPaymentMethod(userId, "Debit Card", "CARD");
            createPaymentMethod(userId, "Cash", "CASH");

            // Seed Transactions
            createTransaction(tenantId, userId, bank, salary, "INCOME", new BigDecimal("250000"), "Monthly Salary", "CLEARED");
            createTransaction(tenantId, userId, cash, food, "EXPENSE", new BigDecimal("1500"), "Lunch with team", "CLEARED");

            // Seed Budget
            createBudget(userId, "Monthly Expenses", "MONTHLY", new BigDecimal("50000"), Arrays.asList(food, transport));

            // Seed Products for Tenant
            createProduct(tenantId, "SKU-1001", "890123456701", "Wireless Optical Mouse", "2.4GHz Ergonomic Mouse", new BigDecimal("800"), new BigDecimal("1500"), 45, 10, "PCS");
            createProduct(tenantId, "SKU-1002", "890123456702", "Mechanical Gaming Keyboard", "RGB Backlit Blue Switches", new BigDecimal("3500"), new BigDecimal("6500"), 20, 5, "PCS");
            createProduct(tenantId, "SKU-1003", "890123456703", "USB-C Fast Charging Cable", "2-Meter Braided Nylon Cable", new BigDecimal("250"), new BigDecimal("600"), 100, 15, "PCS");
            createProduct(tenantId, "SKU-1004", "890123456704", "Full HD 1080p Webcam", "Built-in Noise Cancelling Mic", new BigDecimal("2200"), new BigDecimal("4200"), 8, 10, "PCS");
            createProduct(tenantId, "SKU-1005", "890123456705", "Portable Power Bank 20000mAh", "Dual USB Fast Charge", new BigDecimal("2800"), new BigDecimal("4900"), 3, 5, "PCS");

            // Seed Customers for Tenant
            createCustomer(tenantId, "Walk-in Customer", "000-000-0000", "walkin@mainstore.com", "Main Retail Counter");
            createCustomer(tenantId, "Ali Ahmed", "+92-300-1234567", "ali.ahmed@example.com", "House #45, Street 12, Lahore");
            createCustomer(tenantId, "Sara Khan", "+92-321-9876543", "sara.k@example.com", "Suite 4B, Plaza Center, Karachi");

            System.out.println("Seeded default store tenant: main-store / guest@example.com");
        }
    }

    private Product createProduct(UUID tenantId, String sku, String barcode, String name, String desc, BigDecimal cost, BigDecimal selling, int stock, int reorder, String unit) {
        return productRepository.save(Product.builder()
                .tenantId(tenantId).sku(sku).barcode(barcode).name(name).description(desc)
                .costPrice(cost).sellingPrice(selling).currentStock(stock)
                .reorderLevel(reorder).unit(unit).active(true)
                .createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Customer createCustomer(UUID tenantId, String name, String phone, String email, String address) {
        return customerRepository.save(Customer.builder()
                .tenantId(tenantId).name(name).phone(phone).email(email).address(address)
                .currentCreditBalance(BigDecimal.ZERO)
                .createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Accounts createAccount(UUID tenantId, Long userId, String name, String type, String currency, BigDecimal balance) {
        return accountsRepository.save(Accounts.builder()
                .tenantId(tenantId).userId(userId).name(name).type(type).currencyCode(currency)
                .initialBalance(balance).currentBalance(balance)
                .archived(false).createdAt(new Date()).updatedAt(new Date()).build());
    }

    private Categories createCategory(UUID tenantId, Long userId, String name, String type) {
        return categoriesRepository.save(Categories.builder()
                .tenantId(tenantId).userId(userId).name(name).type(type).sortOrder(0)
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

    private void createTransaction(UUID tenantId, Long userId, Accounts account, Categories category, String type, BigDecimal amount, String desc, String status) {
        transactionsRepository.save(Transactions.builder()
                .tenantId(tenantId).userId(userId).accountId(account.getId()).categoryId(category.getId())
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
