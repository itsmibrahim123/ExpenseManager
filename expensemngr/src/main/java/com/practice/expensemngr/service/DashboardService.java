package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.*;
import io.saadmughal.assignment05.entity.*;
import io.saadmughal.assignment05.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private BudgetsRepository budgetsRepository;

    @Autowired
    private BudgetItemsRepository budgetItemsRepository;

    /**
     * Get dashboard summary with account balances, totals, and recent transactions
     * @param userId User ID
     * @param startDate Start date for period (optional)
     * @param endDate End date for period (optional)
     * @param accountId Filter by specific account (optional)
     * @param limit Number of recent transactions to include
     * @return Dashboard summary
     */
    public DashboardSummaryDTO getDashboardSummary(Long userId, Date startDate, Date endDate,
                                                   Long accountId, Integer limit) {
        // 1. Set default date range if not provided (current month)
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DAY_OF_MONTH, 1);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            startDate = cal.getTime();

            cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
            cal.set(Calendar.SECOND, 59);
            endDate = cal.getTime();
        }

        // 2. Get all user accounts
        List<Accounts> accounts;
        if (accountId != null) {
            accounts = accountsRepository.findById(accountId)
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        } else {
            accounts = accountsRepository.findByUserId(userId);
        }

        // 3. Build account summaries
        List<AccountSummaryDTO> accountSummaries = accounts.stream()
                .map(account -> AccountSummaryDTO.builder()
                        .accountId(account.getId())
                        .accountName(account.getName())
                        .accountType(account.getType())
                        .currentBalance(account.getCurrentBalance())
                        .currencyCode(account.getCurrencyCode())
                        .archived(account.getArchived())
                        .build())
                .collect(Collectors.toList());

        // 4. Calculate total balance (only active accounts)
        BigDecimal totalBalance = accounts.stream()
                .filter(a -> !a.getArchived())
                .map(Accounts::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Get transactions for the period
        List<Transactions> transactions;
        if (accountId != null) {
            transactions = getTransactionsByAccountAndDateRange(accountId, startDate, endDate);
        } else {
            transactions = getTransactionsByUserAndDateRange(userId, startDate, endDate);
        }

        // 6. Calculate totals
        BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getType()) && "CLEARED".equals(t.getStatus()))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getType()) && "CLEARED".equals(t.getStatus()))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        // 7. Get recent transactions
        int recentLimit = (limit != null && limit > 0) ? limit : 10;
        List<RecentTransactionSummaryDTO> recentTransactions = transactions.stream()
                .sorted(Comparator.comparing(Transactions::getTransactionDate).reversed()
                        .thenComparing(Comparator.comparing(Transactions::getCreatedAt).reversed()))
                .limit(recentLimit)
                .map(this::toRecentTransactionSummary)
                .collect(Collectors.toList());

        // 8. Generate period description
        SimpleDateFormat monthFormat = new SimpleDateFormat("MMMM yyyy");
        String periodDescription = monthFormat.format(startDate);

        // 9. Build and return summary
        return DashboardSummaryDTO.builder()
                .accounts(accountSummaries)
                .totalBalance(totalBalance)
                .accountCount(accounts.size())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netSavings(netSavings)
                .transactionCount(transactions.size())
                .recentTransactions(recentTransactions)
                .startDate(startDate)
                .endDate(endDate)
                .periodDescription(periodDescription)
                .build();
    }

    /**
     * Get category breakdown for expenses or income
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @param type Transaction type (EXPENSE or INCOME)
     * @param accountId Filter by account (optional)
     * @return Category breakdown
     */
    public CategoryBreakdownDTO getCategoryBreakdown(Long userId, Date startDate, Date endDate,
                                                     String type, Long accountId) {
        // 1. Set default date range if not provided (current month)
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DAY_OF_MONTH, 1);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            startDate = cal.getTime();

            cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
            cal.set(Calendar.SECOND, 59);
            endDate = cal.getTime();
        }

        // 2. Get transactions for the period and type
        List<Transactions> transactions;
        if (accountId != null) {
            transactions = getTransactionsByAccountAndDateRange(accountId, startDate, endDate);
        } else {
            transactions = getTransactionsByUserAndDateRange(userId, startDate, endDate);
        }

        // 3. Filter by type and status
        transactions = transactions.stream()
                .filter(t -> type.equals(t.getType()) && "CLEARED".equals(t.getStatus()))
                .collect(Collectors.toList());

        // 4. Group by category and sum amounts
        Map<Long, BigDecimal> categoryAmounts = new HashMap<>();
        Map<Long, Integer> categoryTransactionCounts = new HashMap<>();

        for (Transactions transaction : transactions) {
            Long categoryId = transaction.getCategoryId();
            BigDecimal amount = transaction.getAmount();

            categoryAmounts.put(categoryId,
                    categoryAmounts.getOrDefault(categoryId, BigDecimal.ZERO).add(amount));
            categoryTransactionCounts.put(categoryId,
                    categoryTransactionCounts.getOrDefault(categoryId, 0) + 1);
        }

        // 5. Calculate total amount
        BigDecimal totalAmount = categoryAmounts.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 6. Build category breakdown items
        List<CategoryBreakdownItemDTO> categoryItems = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : categoryAmounts.entrySet()) {
            Long categoryId = entry.getKey();
            BigDecimal amount = entry.getValue();

            Categories category = categoriesRepository.findById(categoryId).orElse(null);
            if (category == null) continue;

            // Calculate percentage
            double percentage = 0.0;
            if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.divide(totalAmount, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .doubleValue();
            }

            CategoryBreakdownItemDTO item = CategoryBreakdownItemDTO.builder()
                    .categoryId(categoryId)
                    .categoryName(category.getName())
                    .amount(amount)
                    .percentage(percentage)
                    .transactionCount(categoryTransactionCounts.get(categoryId))
                    .color(category.getColor())
                    .build();

            categoryItems.add(item);
        }

        // 7. Sort by amount descending
        categoryItems.sort(Comparator.comparing(CategoryBreakdownItemDTO::getAmount).reversed());

        // 8. Build and return breakdown
        return CategoryBreakdownDTO.builder()
                .type(type)
                .categories(categoryItems)
                .totalAmount(totalAmount)
                .totalTransactionCount(transactions.size())
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    /**
     * Get top N categories by spending or income
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @param limit Number of top categories
     * @param type Transaction type (EXPENSE or INCOME)
     * @return Top categories
     */
    public TopCategoryDTO getTopCategories(Long userId, Date startDate, Date endDate,
                                           Integer limit, String type) {
        // 1. Get category breakdown
        CategoryBreakdownDTO breakdown = getCategoryBreakdown(userId, startDate, endDate, type, null);

        // 2. Limit to top N
        int topLimit = (limit != null && limit > 0) ? limit : 5;
        List<CategoryBreakdownItemDTO> topCategories = breakdown.getCategories().stream()
                .limit(topLimit)
                .collect(Collectors.toList());

        // 3. Build and return
        return TopCategoryDTO.builder()
                .type(type)
                .topCategories(topCategories)
                .limit(topLimit)
                .totalAmount(breakdown.getTotalAmount())
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    /**
     * Get account balance overview
     * @param userId User ID
     * @return Account balance overview
     */
    public AccountBalanceOverviewDTO getAccountBalanceOverview(Long userId) {
        // 1. Get all user accounts
        List<Accounts> accounts = accountsRepository.findByUserId(userId);

        // 2. Build account summaries
        List<AccountSummaryDTO> accountSummaries = accounts.stream()
                .map(account -> AccountSummaryDTO.builder()
                        .accountId(account.getId())
                        .accountName(account.getName())
                        .accountType(account.getType())
                        .currentBalance(account.getCurrentBalance())
                        .currencyCode(account.getCurrencyCode())
                        .archived(account.getArchived())
                        .build())
                .collect(Collectors.toList());

        // 3. Calculate totals
        BigDecimal totalBalance = BigDecimal.ZERO;
        int activeCount = 0;
        int archivedCount = 0;

        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal bankTotal = BigDecimal.ZERO;
        BigDecimal creditCardTotal = BigDecimal.ZERO;
        BigDecimal mobileWalletTotal = BigDecimal.ZERO;
        BigDecimal otherTotal = BigDecimal.ZERO;

        for (Accounts account : accounts) {
            if (!account.getArchived()) {
                totalBalance = totalBalance.add(account.getCurrentBalance());
                activeCount++;
            } else {
                archivedCount++;
            }

            // Group by type
            switch (account.getType()) {
                case "Cash":
                    cashTotal = cashTotal.add(account.getCurrentBalance());
                    break;
                case "Bank":
                    bankTotal = bankTotal.add(account.getCurrentBalance());
                    break;
                case "Credit Card":
                    creditCardTotal = creditCardTotal.add(account.getCurrentBalance());
                    break;
                case "Mobile Wallet":
                    mobileWalletTotal = mobileWalletTotal.add(account.getCurrentBalance());
                    break;
                default:
                    otherTotal = otherTotal.add(account.getCurrentBalance());
                    break;
            }
        }

        // 4. Build and return overview
        return AccountBalanceOverviewDTO.builder()
                .accounts(accountSummaries)
                .totalBalance(totalBalance)
                .totalAccounts(accounts.size())
                .activeAccounts(activeCount)
                .archivedAccounts(archivedCount)
                .cashTotal(cashTotal)
                .bankTotal(bankTotal)
                .creditCardTotal(creditCardTotal)
                .mobileWalletTotal(mobileWalletTotal)
                .otherTotal(otherTotal)
                .build();
    }

    /**
     * Helper: Get transactions by user and date range
     */
    private List<Transactions> getTransactionsByUserAndDateRange(Long userId, Date startDate, Date endDate) {
        return transactionsRepository.findAll().stream()
                .filter(t -> t.getUserId().equals(userId))
                .filter(t -> !t.getTransactionDate().before(startDate) && !t.getTransactionDate().after(endDate))
                .collect(Collectors.toList());
    }

    /**
     * Helper: Get transactions by account and date range
     */
    private List<Transactions> getTransactionsByAccountAndDateRange(Long accountId, Date startDate, Date endDate) {
        return transactionsRepository.findAll().stream()
                .filter(t -> t.getAccountId().equals(accountId))
                .filter(t -> !t.getTransactionDate().before(startDate) && !t.getTransactionDate().after(endDate))
                .collect(Collectors.toList());
    }

    /**
     * Helper: Convert transaction to recent summary
     */
    private RecentTransactionSummaryDTO toRecentTransactionSummary(Transactions transaction) {
        Categories category = categoriesRepository.findById(transaction.getCategoryId()).orElse(null);
        Accounts account = accountsRepository.findById(transaction.getAccountId()).orElse(null);

        return RecentTransactionSummaryDTO.builder()
                .transactionId(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .description(transaction.getDescription())
                .categoryName(category != null ? category.getName() : null)
                .accountName(account != null ? account.getName() : null)
                .transactionDate(transaction.getTransactionDate())
                .status(transaction.getStatus())
                .build();
    }

    /**
     * Get budget progress for active budgets in the period
     * @param userId User ID
     * @param startDate Start date for report (optional)
     * @param endDate End date for report (optional)
     * @return List of budget progress
     */
    public List<BudgetProgressDTO> getBudgetProgress(Long userId, Date startDate, Date endDate) {
        // 1. Set default date range if not provided (current month)
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DAY_OF_MONTH, 1);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            startDate = cal.getTime();

            cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
            cal.set(Calendar.SECOND, 59);
            endDate = cal.getTime();
        }

        // 2. Get all user budgets
        List<Budgets> budgets = budgetsRepository.findByUserId(userId);

        // 3. Filter budgets that overlap with the report period
        final Date finalStartDate = startDate;
        final Date finalEndDate = endDate;
        budgets = budgets.stream()
                .filter(b -> !b.getEndDate().before(finalStartDate) && !b.getStartDate().after(finalEndDate))
                .collect(Collectors.toList());

        // 4. Build progress for each budget
        List<BudgetProgressDTO> progressList = new ArrayList<>();
        for (Budgets budget : budgets) {
            // Get budget items
            List<BudgetItems> items = budgetItemsRepository.findByBudgetId(budget.getId());

            // Calculate progress for each item
            List<BudgetItemProgressDTO> itemProgressList = new ArrayList<>();
            BigDecimal totalBudgeted = BigDecimal.ZERO;
            BigDecimal totalActual = BigDecimal.ZERO;

            for (BudgetItems item : items) {
                // Get actual spending for this category in the budget period
                BigDecimal actual = calculateActualSpendingForCategory(
                        userId,
                        item.getCategoryId(),
                        budget.getStartDate(),
                        budget.getEndDate()
                );

                BigDecimal remaining = item.getLimitAmount().subtract(actual);
                double percentage = 0.0;
                if (item.getLimitAmount().compareTo(BigDecimal.ZERO) > 0) {
                    percentage = actual.divide(item.getLimitAmount(), 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"))
                            .doubleValue();
                }

                // Determine status
                String status = determineStatus(percentage, item.getWarningPercent());

                // Get category name
                Categories category = categoriesRepository.findById(item.getCategoryId()).orElse(null);

                BudgetItemProgressDTO itemProgress = BudgetItemProgressDTO.builder()
                        .budgetItemId(item.getId())
                        .categoryId(item.getCategoryId())
                        .categoryName(category != null ? category.getName() : null)
                        .budgeted(item.getLimitAmount())
                        .actual(actual)
                        .remaining(remaining)
                        .percentage(percentage)
                        .status(status)
                        .warningPercent(item.getWarningPercent())
                        .build();

                itemProgressList.add(itemProgress);
                totalBudgeted = totalBudgeted.add(item.getLimitAmount());
                totalActual = totalActual.add(actual);
            }

            // Calculate overall budget progress
            BigDecimal totalRemaining = totalBudgeted.subtract(totalActual);
            double overallPercentage = 0.0;
            if (totalBudgeted.compareTo(BigDecimal.ZERO) > 0) {
                overallPercentage = totalActual.divide(totalBudgeted, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .doubleValue();
            }

            String overallStatus = determineStatus(overallPercentage, 80); // Default 80% warning

            BudgetProgressDTO progress = BudgetProgressDTO.builder()
                    .budgetId(budget.getId())
                    .budgetName(budget.getName())
                    .budgetStartDate(budget.getStartDate())
                    .budgetEndDate(budget.getEndDate())
                    .totalBudgeted(totalBudgeted)
                    .totalActual(totalActual)
                    .totalRemaining(totalRemaining)
                    .overallPercentage(overallPercentage)
                    .overallStatus(overallStatus)
                    .items(itemProgressList)
                    .reportStartDate(finalStartDate)
                    .reportEndDate(finalEndDate)
                    .build();

            progressList.add(progress);
        }

        return progressList;
    }

    /**
     * Get spending trends grouped by period
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @param groupBy Grouping: DAILY, WEEKLY, MONTHLY
     * @param accountId Filter by account (optional)
     * @return Spending trends
     */
    public SpendingTrendDTO getSpendingTrends(Long userId, Date startDate, Date endDate,
                                              String groupBy, Long accountId) {
        // 1. Set default date range if not provided (last 30 days)
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            endDate = cal.getTime();

            cal.add(Calendar.DAY_OF_MONTH, -30);
            startDate = cal.getTime();
        }

        // 2. Set default groupBy if not provided
        if (groupBy == null || groupBy.isEmpty()) {
            groupBy = "DAILY";
        }

        // 3. Get transactions for the period
        List<Transactions> transactions;
        if (accountId != null) {
            transactions = getTransactionsByAccountAndDateRange(accountId, startDate, endDate);
        } else {
            transactions = getTransactionsByUserAndDateRange(userId, startDate, endDate);
        }

        // 4. Filter only CLEARED transactions
        transactions = transactions.stream()
                .filter(t -> "CLEARED".equals(t.getStatus()))
                .collect(Collectors.toList());

        // 5. Group transactions by period
        Map<String, List<Transactions>> groupedTransactions = new LinkedHashMap<>();
        SimpleDateFormat dateFormat = getDateFormatForGrouping(groupBy);

        for (Transactions transaction : transactions) {
            String period = formatPeriod(transaction.getTransactionDate(), groupBy, dateFormat);
            groupedTransactions.computeIfAbsent(period, k -> new ArrayList<>()).add(transaction);
        }

        // 6. Build data points
        List<SpendingTrendDataPointDTO> dataPoints = new ArrayList<>();
        for (Map.Entry<String, List<Transactions>> entry : groupedTransactions.entrySet()) {
            String period = entry.getKey();
            List<Transactions> periodTransactions = entry.getValue();

            BigDecimal income = periodTransactions.stream()
                    .filter(t -> "INCOME".equals(t.getType()))
                    .map(Transactions::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal expense = periodTransactions.stream()
                    .filter(t -> "EXPENSE".equals(t.getType()))
                    .map(Transactions::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal net = income.subtract(expense);

            SpendingTrendDataPointDTO dataPoint = SpendingTrendDataPointDTO.builder()
                    .period(period)
                    .income(income)
                    .expense(expense)
                    .net(net)
                    .transactionCount(periodTransactions.size())
                    .build();

            dataPoints.add(dataPoint);
        }

        // 7. Build and return trend
        return SpendingTrendDTO.builder()
                .groupBy(groupBy)
                .dataPoints(dataPoints)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    /**
     * Get income vs expense comparison
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @param accountId Filter by account (optional)
     * @return Income vs expense comparison
     */
    public IncomeExpenseComparisonDTO getIncomeExpenseComparison(Long userId, Date startDate,
                                                                 Date endDate, Long accountId) {
        // 1. Set default date range if not provided (current month)
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DAY_OF_MONTH, 1);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            startDate = cal.getTime();

            cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
            cal.set(Calendar.SECOND, 59);
            endDate = cal.getTime();
        }

        // 2. Get transactions for the period
        List<Transactions> transactions;
        if (accountId != null) {
            transactions = getTransactionsByAccountAndDateRange(accountId, startDate, endDate);
        } else {
            transactions = getTransactionsByUserAndDateRange(userId, startDate, endDate);
        }

        // 3. Filter only CLEARED transactions
        transactions = transactions.stream()
                .filter(t -> "CLEARED".equals(t.getStatus()))
                .collect(Collectors.toList());

        // 4. Calculate income totals
        List<Transactions> incomeTransactions = transactions.stream()
                .filter(t -> "INCOME".equals(t.getType()))
                .collect(Collectors.toList());

        BigDecimal totalIncome = incomeTransactions.stream()
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int incomeCount = incomeTransactions.size();

        // 5. Calculate expense totals
        List<Transactions> expenseTransactions = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getType()))
                .collect(Collectors.toList());

        BigDecimal totalExpense = expenseTransactions.stream()
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int expenseCount = expenseTransactions.size();

        // 6. Calculate net savings
        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        // 7. Calculate savings rate
        double savingsRate = 0.0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.divide(totalIncome, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .doubleValue();
        }

        // 8. Calculate averages
        BigDecimal averageIncome = BigDecimal.ZERO;
        if (incomeCount > 0) {
            averageIncome = totalIncome.divide(new BigDecimal(incomeCount), 2, RoundingMode.HALF_UP);
        }

        BigDecimal averageExpense = BigDecimal.ZERO;
        if (expenseCount > 0) {
            averageExpense = totalExpense.divide(new BigDecimal(expenseCount), 2, RoundingMode.HALF_UP);
        }

        // 9. Generate period description
        SimpleDateFormat monthFormat = new SimpleDateFormat("MMMM yyyy");
        String periodDescription = monthFormat.format(startDate);

        // 10. Build and return comparison
        return IncomeExpenseComparisonDTO.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netSavings(netSavings)
                .savingsRate(savingsRate)
                .incomeTransactionCount(incomeCount)
                .expenseTransactionCount(expenseCount)
                .averageIncome(averageIncome)
                .averageExpense(averageExpense)
                .startDate(startDate)
                .endDate(endDate)
                .periodDescription(periodDescription)
                .build();
    }

    /**
     * Helper: Calculate actual spending for a category in a period
     */
    private BigDecimal calculateActualSpendingForCategory(Long userId, Long categoryId,
                                                          Date startDate, Date endDate) {
        List<Transactions> transactions = getTransactionsByUserAndDateRange(userId, startDate, endDate);

        return transactions.stream()
                .filter(t -> categoryId.equals(t.getCategoryId()))
                .filter(t -> "EXPENSE".equals(t.getType()))
                .filter(t -> "CLEARED".equals(t.getStatus()))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Helper: Determine budget status based on percentage
     */
    private String determineStatus(double percentage, Integer warningPercent) {
        int warning = (warningPercent != null) ? warningPercent : 80;

        if (percentage >= 100.0) {
            return "OVER_BUDGET";
        } else if (percentage >= warning) {
            return "WARNING";
        } else {
            return "ON_TRACK";
        }
    }

    /**
     * Helper: Get date format for grouping
     */
    private SimpleDateFormat getDateFormatForGrouping(String groupBy) {
        switch (groupBy) {
            case "DAILY":
                return new SimpleDateFormat("yyyy-MM-dd");
            case "WEEKLY":
                return new SimpleDateFormat("yyyy-'W'ww");
            case "MONTHLY":
                return new SimpleDateFormat("yyyy-MM");
            default:
                return new SimpleDateFormat("yyyy-MM-dd");
        }
    }

    /**
     * Helper: Format period label
     */
    private String formatPeriod(Date date, String groupBy, SimpleDateFormat dateFormat) {
        switch (groupBy) {
            case "DAILY":
                return dateFormat.format(date); // "2025-12-03"
            case "WEEKLY":
                return dateFormat.format(date); // "2025-W49"
            case "MONTHLY":
                SimpleDateFormat monthFormat = new SimpleDateFormat("MMM yyyy");
                return monthFormat.format(date); // "Dec 2025"
            default:
                return dateFormat.format(date);
        }
    }
}