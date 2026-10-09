package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.AuthRequest;
import com.practice.expensemngr.dto.AuthResponse;
import com.practice.expensemngr.dto.RegisterRequest;
import com.practice.expensemngr.entity.*;
import com.practice.expensemngr.repository.TenantRepository;
import com.practice.expensemngr.repository.TenantSettingsRepository;
import com.practice.expensemngr.repository.UsersRepository;
import com.practice.expensemngr.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final TenantRepository tenantRepository;
    private final TenantSettingsRepository tenantSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    // Register
    public String registerUser(RegisterRequest request) {
        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Users newUser = Users.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.ROLE_STORE_ADMIN)
                .userStatus(UserStatus.ACTIVE)
                .status("ACTIVE")
                .preferredCurrency(request.getPreferredCurrency() != null ? request.getPreferredCurrency() : "PKR")
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        usersRepository.save(newUser);
        return "User registered successfully!";
    }

    // Login
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Users user = usersRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getEmail()));

        var userDetails = userDetailsService.loadUserByUsername(request.getEmail());

        String roleStr = user.getRole() != null ? user.getRole().name() : UserRole.ROLE_STORE_ADMIN.name();
        var jwtToken = jwtUtils.generateToken(userDetails, user.getTenantId(), roleStr);

        Tenant tenant = user.getTenantId() != null ? tenantRepository.findById(user.getTenantId()).orElse(null) : null;
        TenantSettings settings = user.getTenantId() != null ? tenantSettingsRepository.findByTenantId(user.getTenantId()).orElse(null) : null;

        return AuthResponse.builder()
                .token(jwtToken)
                .type("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole() : UserRole.ROLE_STORE_ADMIN)
                .tenantId(user.getTenantId())
                .storeName(tenant != null ? tenant.getStoreName() : "SaaS Platform Admin")
                .tenantSettings(settings)
                .build();
    }
}