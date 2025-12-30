package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.RecurringRuleCreateRequestDTO;
import io.saadmughal.assignment05.dto.RecurringRuleResponseDTO;
import io.saadmughal.assignment05.dto.RecurringRuleUpdateRequestDTO;
import io.saadmughal.assignment05.entity.*;
import io.saadmughal.assignment05.exception.*;
import io.saadmughal.assignment05.repository.*;
import io.saadmughal.assignment05.util.RecurringDateCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecurringRulesService {

    @Autowired
    private RecurringRulesRepository recurringRulesRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private PaymentMethodsRepository paymentMethodsRepository;

    @Autowired
    private MerchantsRepository merchantsRepository;

    /**
     * Create a new recurring rule
     * @param request Recurring rule creation data
     * @return Created recurring rule
     */
    @Transactional
    public RecurringRuleResponseDTO createRecurringRule(RecurringRuleCreateRequestDTO request) {
        // 1. Validate frequency
        if (!isValidFrequency(request.getFrequency())) {
            throw new InvalidFrequencyException(request.getFrequency());
        }

        // 2. Validate interval
        if (request.getIntervalVal() == null || request.getIntervalVal() < 1) {
            throw new InvalidIntervalException();
        }

        // 3. Validate day of month for MONTHLY frequency
        if (request.getFrequency().equals("MONTHLY")) {
            if (request.getDayOfMonth() == null) {
                throw new InvalidDayOfMonthException(null);
            }
            if (request.getDayOfMonth() < 1 || request.getDayOfMonth() > 31) {
                throw new InvalidDayOfMonthException(request.getDayOfMonth());
            }
        }

        // 4. Validate day of week for WEEKLY frequency
        if (request.getFrequency().equals("WEEKLY")) {
            if (request.getDayOfWeek() == null || !isValidDayOfWeek(request.getDayOfWeek())) {
                throw new InvalidDayOfWeekException(request.getDayOfWeek());
            }
        }

        // 5. Validate date range
        if (request.getEndDate() != null && request.getEndDate().before(request.getStartDate())) {
            throw new InvalidDateRangeException();
        }

        // 6. Verify account exists
        Accounts account = accountsRepository.findById(request.getAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getAccountId()));

        // 7. Verify category exists
        Categories category = categoriesRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new CategoryNotFoundException(request.getCategoryId()));

        // 8. Calculate initial next run date
        Date nextRunDate = RecurringDateCalculator.calculateInitialNextRunDate(
                request.getStartDate(),
                request.getFrequency(),
                request.getIntervalVal(),
                request.getDayOfMonth(),
                request.getDayOfWeek()
        );

        // 9. Create recurring rule entity
        RecurringRules rule = RecurringRules.builder()
                .userId(request.getUserId())
                .accountId(request.getAccountId())
                .categoryId(request.getCategoryId())
                .paymentMethodId(request.getPaymentMethodId())
                .merchantId(request.getMerchantId())
                .type(request.getType())
                .amount(request.getAmount())
                .currencyCode(request.getCurrencyCode().toUpperCase())
                .description(request.getDescription())
                .frequency(request.getFrequency())
                .intervalVal(request.getIntervalVal())
                .dayOfMonth(request.getDayOfMonth())
                .dayOfWeek(request.getDayOfWeek())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .nextRunDate(nextRunDate)
                .active(true) // Active by default
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        rule = recurringRulesRepository.save(rule);

        // 10. Build and return response
        return toResponseDTO(rule, account, category);
    }

    /**
     * Get all recurring rules for a user
     * @param userId User ID
     * @param active Filter by active status (optional)
     * @param type Filter by transaction type (optional)
     * @return List of recurring rules
     */
    public List<RecurringRuleResponseDTO> getRecurringRulesByUser(Long userId, Boolean active, String type) {
        List<RecurringRules> rules;

        if (active != null && type != null) {
            rules = recurringRulesRepository.findByUserIdAndTypeAndActive(userId, type, active);
        } else if (active != null) {
            rules = recurringRulesRepository.findByUserIdAndActive(userId, active);
        } else if (type != null) {
            rules = recurringRulesRepository.findByUserIdAndType(userId, type);
        } else {
            rules = recurringRulesRepository.findByUserIdOrderByNextRunDateAsc(userId);
        }

        return rules.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single recurring rule by ID
     * @param ruleId Rule ID
     * @return Recurring rule details
     */
    public RecurringRuleResponseDTO getRecurringRuleById(Long ruleId) {
        RecurringRules rule = recurringRulesRepository.findById(ruleId)
                .orElseThrow(() -> new RecurringRuleNotFoundException(ruleId));

        return toResponseDTO(rule);
    }

    /**
     * Get all recurring rules for a specific account
     * @param accountId Account ID
     * @return List of recurring rules
     */
    public List<RecurringRuleResponseDTO> getRecurringRulesByAccount(Long accountId) {
        List<RecurringRules> rules = recurringRulesRepository.findByAccountId(accountId);

        return rules.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Validate frequency type
     */
    private boolean isValidFrequency(String frequency) {
        return frequency.equals("DAILY") ||
                frequency.equals("WEEKLY") ||
                frequency.equals("MONTHLY") ||
                frequency.equals("YEARLY");
    }

    /**
     * Validate day of week
     */
    private boolean isValidDayOfWeek(String dayOfWeek) {
        if (dayOfWeek == null) {
            return false;
        }
        return dayOfWeek.equals("SUNDAY") ||
                dayOfWeek.equals("MONDAY") ||
                dayOfWeek.equals("TUESDAY") ||
                dayOfWeek.equals("WEDNESDAY") ||
                dayOfWeek.equals("THURSDAY") ||
                dayOfWeek.equals("FRIDAY") ||
                dayOfWeek.equals("SATURDAY");
    }

    /**
     * Convert entity to response DTO with related entity names
     */
    private RecurringRuleResponseDTO toResponseDTO(RecurringRules rule, Accounts account, Categories category) {
        // Get payment method name if present
        String paymentMethodName = null;
        if (rule.getPaymentMethodId() != null) {
            paymentMethodName = paymentMethodsRepository.findById(rule.getPaymentMethodId())
                    .map(PaymentMethods::getName)
                    .orElse(null);
        }

        // Get merchant name if present
        String merchantName = null;
        if (rule.getMerchantId() != null) {
            merchantName = merchantsRepository.findById(rule.getMerchantId())
                    .map(Merchants::getName)
                    .orElse(null);
        }

        // Generate frequency description
        String frequencyDescription = RecurringDateCalculator.generateFrequencyDescription(
                rule.getFrequency(),
                rule.getIntervalVal(),
                rule.getDayOfMonth(),
                rule.getDayOfWeek()
        );

        // Generate status description
        String statusDescription = RecurringDateCalculator.generateStatusDescription(
                rule.getActive(),
                rule.getEndDate()
        );

        return RecurringRuleResponseDTO.builder()
                .id(rule.getId())
                .userId(rule.getUserId())
                .accountId(rule.getAccountId())
                .accountName(account.getName())
                .categoryId(rule.getCategoryId())
                .categoryName(category.getName())
                .paymentMethodId(rule.getPaymentMethodId())
                .paymentMethodName(paymentMethodName)
                .merchantId(rule.getMerchantId())
                .merchantName(merchantName)
                .type(rule.getType())
                .amount(rule.getAmount())
                .currencyCode(rule.getCurrencyCode())
                .description(rule.getDescription())
                .frequency(rule.getFrequency())
                .intervalVal(rule.getIntervalVal())
                .dayOfMonth(rule.getDayOfMonth())
                .dayOfWeek(rule.getDayOfWeek())
                .startDate(rule.getStartDate())
                .endDate(rule.getEndDate())
                .nextRunDate(rule.getNextRunDate())
                .active(rule.getActive())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .frequencyDescription(frequencyDescription)
                .statusDescription(statusDescription)
                .build();
    }

    /**
     * Convert entity to response DTO (fetch related entities)
     */
    private RecurringRuleResponseDTO toResponseDTO(RecurringRules rule) {
        Accounts account = accountsRepository.findById(rule.getAccountId()).orElse(null);
        Categories category = categoriesRepository.findById(rule.getCategoryId()).orElse(null);

        return toResponseDTO(rule, account, category);
    }

    /**
     * Update an existing recurring rule
     * @param ruleId Rule ID
     * @param request Update data
     * @return Updated recurring rule
     */
    @Transactional
    public RecurringRuleResponseDTO updateRecurringRule(Long ruleId, RecurringRuleUpdateRequestDTO request) {
        // 1. Find existing rule
        RecurringRules rule = recurringRulesRepository.findById(ruleId)
                .orElseThrow(() -> new RecurringRuleNotFoundException(ruleId));

        // 2. Update amount if provided
        if (request.getAmount() != null) {
            rule.setAmount(request.getAmount());
        }

        // 3. Update description if provided
        if (request.getDescription() != null) {
            rule.setDescription(request.getDescription());
        }

        // 4. Update interval if provided
        if (request.getIntervalVal() != null) {
            if (request.getIntervalVal() < 1) {
                throw new InvalidIntervalException();
            }
            rule.setIntervalVal(request.getIntervalVal());

            // Recalculate next run date with new interval
            Date newNextRunDate = RecurringDateCalculator.calculateNextRunDate(
                    rule.getNextRunDate(),
                    rule.getFrequency(),
                    request.getIntervalVal(),
                    rule.getDayOfMonth(),
                    rule.getDayOfWeek()
            );
            rule.setNextRunDate(newNextRunDate);
        }

        // 5. Update day of month if provided (for MONTHLY rules)
        if (request.getDayOfMonth() != null) {
            if (rule.getFrequency().equals("MONTHLY")) {
                if (request.getDayOfMonth() < 1 || request.getDayOfMonth() > 31) {
                    throw new InvalidDayOfMonthException(request.getDayOfMonth());
                }
                rule.setDayOfMonth(request.getDayOfMonth());

                // Recalculate next run date with new day
                Date newNextRunDate = RecurringDateCalculator.calculateNextRunDate(
                        rule.getNextRunDate(),
                        rule.getFrequency(),
                        rule.getIntervalVal(),
                        request.getDayOfMonth(),
                        rule.getDayOfWeek()
                );
                rule.setNextRunDate(newNextRunDate);
            }
        }

        // 6. Update day of week if provided (for WEEKLY rules)
        if (request.getDayOfWeek() != null) {
            if (rule.getFrequency().equals("WEEKLY")) {
                if (!isValidDayOfWeek(request.getDayOfWeek())) {
                    throw new InvalidDayOfWeekException(request.getDayOfWeek());
                }
                rule.setDayOfWeek(request.getDayOfWeek());

                // Recalculate next run date with new day
                Date newNextRunDate = RecurringDateCalculator.calculateNextRunDate(
                        rule.getNextRunDate(),
                        rule.getFrequency(),
                        rule.getIntervalVal(),
                        rule.getDayOfMonth(),
                        request.getDayOfWeek()
                );
                rule.setNextRunDate(newNextRunDate);
            }
        }

        // 7. Update end date if provided
        if (request.getEndDate() != null) {
            if (request.getEndDate().before(rule.getStartDate())) {
                throw new InvalidDateRangeException();
            }
            rule.setEndDate(request.getEndDate());
        }

        // 8. Update timestamp
        rule.setUpdatedAt(new Date());

        rule = recurringRulesRepository.save(rule);

        // 9. Return updated rule
        return toResponseDTO(rule);
    }

    /**
     * Delete a recurring rule
     * @param ruleId Rule ID
     */
    @Transactional
    public void deleteRecurringRule(Long ruleId) {
        // 1. Verify rule exists
        RecurringRules rule = recurringRulesRepository.findById(ruleId)
                .orElseThrow(() -> new RecurringRuleNotFoundException(ruleId));

        // 2. Delete rule
        recurringRulesRepository.delete(rule);
    }

    /**
     * Toggle active status of a recurring rule
     * @param ruleId Rule ID
     * @param active New active status
     * @return Updated recurring rule
     */
    @Transactional
    public RecurringRuleResponseDTO toggleRecurringRule(Long ruleId, Boolean active) {
        // 1. Find existing rule
        RecurringRules rule = recurringRulesRepository.findById(ruleId)
                .orElseThrow(() -> new RecurringRuleNotFoundException(ruleId));

        // 2. Update active status
        rule.setActive(active);
        rule.setUpdatedAt(new Date());

        rule = recurringRulesRepository.save(rule);

        // 3. Return updated rule
        return toResponseDTO(rule);
    }

    /**
     * Activate a recurring rule
     * @param ruleId Rule ID
     * @return Updated recurring rule
     */
    @Transactional
    public RecurringRuleResponseDTO activateRecurringRule(Long ruleId) {
        return toggleRecurringRule(ruleId, true);
    }

    /**
     * Deactivate a recurring rule
     * @param ruleId Rule ID
     * @return Updated recurring rule
     */
    @Transactional
    public RecurringRuleResponseDTO deactivateRecurringRule(Long ruleId) {
        return toggleRecurringRule(ruleId, false);
    }
}