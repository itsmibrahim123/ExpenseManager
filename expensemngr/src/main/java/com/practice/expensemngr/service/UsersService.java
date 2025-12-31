package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.UsersDTO;
import com.practice.expensemngr.dto.UserRegistrationResponseDTO;
import com.practice.expensemngr.entity.Accounts;
import com.practice.expensemngr.entity.Categories;
import com.practice.expensemngr.entity.NotificationPreferences;
import com.practice.expensemngr.entity.Users;
import com.practice.expensemngr.exception.InvalidEmailFormatException;
import com.practice.expensemngr.exception.UserAlreadyExistsException;
import com.practice.expensemngr.exception.WeakPasswordException;
import com.practice.expensemngr.repository.AccountsRepository;
import com.practice.expensemngr.repository.CategoriesRepository;
import com.practice.expensemngr.repository.NotificationPreferencesRepository;
import com.practice.expensemngr.repository.UsersRepository;
import com.practice.expensemngr.util.EmailValidator;
import com.practice.expensemngr.util.PasswordValidator;
import com.practice.expensemngr.vo.UserRegistrationRequestVO;
import com.practice.expensemngr.vo.UsersQueryVO;
import com.practice.expensemngr.vo.UsersUpdateVO;
import com.practice.expensemngr.vo.UsersVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.practice.expensemngr.dto.LoginRequestDTO;
import com.practice.expensemngr.dto.LoginResponseDTO;
import com.practice.expensemngr.exception.AccountInactiveException;
import com.practice.expensemngr.exception.AccountLockedException;
import com.practice.expensemngr.exception.InvalidCredentialsException;
import com.practice.expensemngr.util.JwtUtil;

import java.math.BigDecimal;
import java.util.Date;
import java.util.NoSuchElementException;

@Service
public class UsersService {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private NotificationPreferencesRepository notificationPreferencesRepository;

    @Autowired
    private NotificationPreferencesService notificationPreferencesService;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user with default account, categories, and notification preferences
     * @param requestVO Registration request data
     * @return UserRegistrationResponseDTO with user details
     * @throws UserAlreadyExistsException if email already exists
     * @throws InvalidEmailFormatException if email format is invalid
     * @throws WeakPasswordException if password doesn't meet requirements
     */
    @Transactional
    public UserRegistrationResponseDTO registerUser(UserRegistrationRequestVO requestVO) {
        // 1. Validate email format
        EmailValidator.validate(requestVO.getEmail());

        // 2. Validate password strength
        PasswordValidator.validate(requestVO.getPassword());

        // 3. Check if user already exists
        if (usersRepository.existsByEmail(requestVO.getEmail())) {
            throw new UserAlreadyExistsException(requestVO.getEmail());
        }

        // 4. Create and save user
        Users user = Users.builder()
                .fullName(requestVO.getFullName())
                .email(requestVO.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(requestVO.getPassword()))
                .status("ACTIVE")
                .preferredCurrency(requestVO.getPreferredCurrency() != null ?
                        requestVO.getPreferredCurrency() : "PKR")
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        user = usersRepository.save(user);

        // 5. Create default account
        createDefaultAccount(user);

        // 6. Create default categories
        createDefaultCategories(user);

        // 7. Create default notification preferences
        notificationPreferencesService.createDefaultPreferences(user.getId());

        // 8. Build and return response
        return UserRegistrationResponseDTO.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .status(user.getStatus())
                .preferredCurrency(user.getPreferredCurrency())
                .createdAt(user.getCreatedAt())
                .message("User registered successfully")
                .build();
    }

    /**
     * Authenticate user and generate JWT token
     * @param loginRequest Login credentials
     * @return LoginResponseDTO with JWT token and user details
     * @throws InvalidCredentialsException if email/password is incorrect
     * @throws AccountLockedException if account is locked
     * @throws AccountInactiveException if account is inactive
     */
    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        // 1. Find user by email
        Users user = usersRepository.findByEmail(loginRequest.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException());

        // 2. Verify password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        // 3. Check account status
        validateAccountStatus(user.getStatus());

        // 4. Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        // 5. Build and return response
        return LoginResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .status(user.getStatus())
                .preferredCurrency(user.getPreferredCurrency())
                .message("Login successful")
                .build();
    }

    /**
     * Validate user account status
     * @param status Account status
     * @throws AccountLockedException if status is LOCKED
     * @throws AccountInactiveException if status is INACTIVE or DELETED
     */
    private void validateAccountStatus(String status) {
        switch (status.toUpperCase()) {
            case "LOCKED":
                throw new AccountLockedException();
            case "INACTIVE":
            case "DELETED":
                throw new AccountInactiveException();
            case "ACTIVE":
                // Valid status, proceed
                break;
            default:
                throw new AccountInactiveException();
        }
    }

    /**
     * Creates a default Cash account for new user
     */
    private void createDefaultAccount(Users user) {
        Accounts account = Accounts.builder()
                .userId(user.getId())
                .name("Cash")
                .type("CASH")
                .currencyCode(user.getPreferredCurrency())
                .initialBalance(BigDecimal.ZERO)
                .currentBalance(BigDecimal.ZERO)
                .archived(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        accountsRepository.save(account);
    }

    /**
     * Creates default categories (Income, Expense, Transfer) for new user
     */
    private void createDefaultCategories(Users user) {
        String[] categoryNames = {"Income", "Expense", "Transfer"};
        String[] categoryTypes = {"INCOME", "EXPENSE", "TRANSFER"};

        for (int i = 0; i < categoryNames.length; i++) {
            Categories category = Categories.builder()
                    .userId(user.getId())
                    .name(categoryNames[i])
                    .type(categoryTypes[i])
                    .sortOrder(i + 1)
                    .archived(false)
                    .createdAt(new Date())
                    .updatedAt(new Date())
                    .build();

            categoriesRepository.save(category);
        }
    }

    public Long save(UsersVO vO) {
        Users bean = new Users();
        BeanUtils.copyProperties(vO, bean);
        bean = usersRepository.save(bean);
        return bean.getId();
    }

    public void delete(Long id) {
        usersRepository.deleteById(id);
    }

    public void update(Long id, UsersUpdateVO vO) {
        Users bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        usersRepository.save(bean);
    }

    public UsersDTO getById(Long id) {
        Users original = requireOne(id);
        return toDTO(original);
    }

    public Page<UsersDTO> query(UsersQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    private UsersDTO toDTO(Users original) {
        UsersDTO bean = new UsersDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private Users requireOne(Long id) {
        return usersRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}