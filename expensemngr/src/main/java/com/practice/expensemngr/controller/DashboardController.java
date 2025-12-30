package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.*;
import com.practice.expensemngr.service.DashboardService;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get dashboard summary with account balances, totals, and recent transactions
     * @param userId User ID (required)
     * @param startDate Start date (optional, defaults to current month start)
     * @param endDate End date (optional, defaults to current month end)
     * @param accountId Filter by specific account (optional)
     * @param limit Number of recent transactions (optional, default 10)
     * @return Dashboard summary
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Integer limit) {
        DashboardSummaryDTO summary = dashboardService.getDashboardSummary(
                userId, startDate, endDate, accountId, limit);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get category breakdown for expenses or income
     * @param userId User ID (required)
     * @param startDate Start date (optional, defaults to current month start)
     * @param endDate End date (optional, defaults to current month end)
     * @param type Transaction type: EXPENSE or INCOME (required)
     * @param accountId Filter by specific account (optional)
     * @return Category breakdown
     */
    @GetMapping("/category-breakdown")
    public ResponseEntity<CategoryBreakdownDTO> getCategoryBreakdown(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam @NotNull String type,
            @RequestParam(required = false) Long accountId) {
        CategoryBreakdownDTO breakdown = dashboardService.getCategoryBreakdown(
                userId, startDate, endDate, type, accountId);
        return ResponseEntity.ok(breakdown);
    }

    /**
     * Get budget progress for active budgets
     * @param userId User ID (required)
     * @param startDate Start date for report (optional, defaults to current month start)
     * @param endDate End date for report (optional, defaults to current month end)
     * @return List of budget progress
     */
    @GetMapping("/budget-progress")
    public ResponseEntity<List<BudgetProgressDTO>> getBudgetProgress(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<BudgetProgressDTO> progress = dashboardService.getBudgetProgress(
                userId, startDate, endDate);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get spending trends grouped by period
     * @param userId User ID (required)
     * @param startDate Start date (optional, defaults to 30 days ago)
     * @param endDate End date (optional, defaults to today)
     * @param groupBy Grouping: DAILY, WEEKLY, MONTHLY (optional, default DAILY)
     * @param accountId Filter by specific account (optional)
     * @return Spending trends
     */
    @GetMapping("/spending-trends")
    public ResponseEntity<SpendingTrendDTO> getSpendingTrends(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) String groupBy,
            @RequestParam(required = false) Long accountId) {
        SpendingTrendDTO trends = dashboardService.getSpendingTrends(
                userId, startDate, endDate, groupBy, accountId);
        return ResponseEntity.ok(trends);
    }

    /**
     * Get income vs expense comparison
     * @param userId User ID (required)
     * @param startDate Start date (optional, defaults to current month start)
     * @param endDate End date (optional, defaults to current month end)
     * @param accountId Filter by specific account (optional)
     * @return Income vs expense comparison
     */
    @GetMapping("/income-expense-comparison")
    public ResponseEntity<IncomeExpenseComparisonDTO> getIncomeExpenseComparison(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) Long accountId) {
        IncomeExpenseComparisonDTO comparison = dashboardService.getIncomeExpenseComparison(
                userId, startDate, endDate, accountId);
        return ResponseEntity.ok(comparison);
    }

    /**
     * Get top N categories by spending or income
     * @param userId User ID (required)
     * @param startDate Start date (optional, defaults to current month start)
     * @param endDate End date (optional, defaults to current month end)
     * @param limit Number of top categories (optional, default 5)
     * @param type Transaction type: EXPENSE or INCOME (required)
     * @return Top categories
     */
    @GetMapping("/top-categories")
    public ResponseEntity<TopCategoryDTO> getTopCategories(
            @RequestParam @NotNull Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) Integer limit,
            @RequestParam @NotNull String type) {
        TopCategoryDTO topCategories = dashboardService.getTopCategories(
                userId, startDate, endDate, limit, type);
        return ResponseEntity.ok(topCategories);
    }

    /**
     * Get account balance overview
     * @param userId User ID (required)
     * @return Account balance overview
     */
    @GetMapping("/account-summary")
    public ResponseEntity<AccountBalanceOverviewDTO> getAccountBalanceOverview(
            @RequestParam @NotNull Long userId) {
        AccountBalanceOverviewDTO overview = dashboardService.getAccountBalanceOverview(userId);
        return ResponseEntity.ok(overview);
    }
}