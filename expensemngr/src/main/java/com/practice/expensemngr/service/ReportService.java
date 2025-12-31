package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.DashboardDTO;
import com.practice.expensemngr.entity.Accounts;
import com.practice.expensemngr.entity.Transactions;
import com.practice.expensemngr.repository.AccountsRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import com.practice.expensemngr.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionsRepository transactionsRepository;
    private final AccountsRepository accountsRepository;
    private final UsersRepository usersRepository;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found")).getId();
    }

    public DashboardDTO getDashboardStats() {
        Long userId = getCurrentUserId();
        DashboardDTO stats = new DashboardDTO();

        // 1. Total Balance (Sum of all accounts)
        List<Accounts> accounts = accountsRepository.findByUserId(userId);
        BigDecimal totalBalance = accounts.stream()
                .map(Accounts::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalBalance(totalBalance);

        // 2. This Month's Transactions
        List<Transactions> allTxns = transactionsRepository.findByUserId(userId);

        Calendar cal = Calendar.getInstance();
        int currentMonth = cal.get(Calendar.MONTH);
        int currentYear = cal.get(Calendar.YEAR);

        List<Transactions> monthTxns = allTxns.stream()
                .filter(t -> {
                    cal.setTime(t.getTransactionDate());
                    return cal.get(Calendar.MONTH) == currentMonth && cal.get(Calendar.YEAR) == currentYear;
                })
                .collect(Collectors.toList());

        // 3. Sum Income & Expense
        BigDecimal income = monthTxns.stream()
                .filter(t -> "INCOME".equalsIgnoreCase(t.getType()))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expense = monthTxns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
                .map(Transactions::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.setIncomeThisMonth(income);
        stats.setExpenseThisMonth(expense);

        // 4. Category Breakdown (Grouping)
        Map<String, BigDecimal> byCategory = monthTxns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Transactions::getAmount, BigDecimal::add)
                ));

        stats.setExpenseByCategory(byCategory);

        return stats;
    }
}