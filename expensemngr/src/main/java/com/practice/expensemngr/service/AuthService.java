package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.AuthRequest;
import com.practice.expensemngr.dto.AuthResponse;
import com.practice.expensemngr.dto.RegisterRequest;
import com.practice.expensemngr.entity.Users;
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
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    // UC-01: Register
    public String registerUser(RegisterRequest request) {

        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Users newUser = Users.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword())) // Hash password
                .status("ACTIVE")
                .preferredCurrency(request.getPreferredCurrency() != null ? request.getPreferredCurrency() : "PKR")
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        usersRepository.save(newUser);

        return "User registered successfully!";
    }

    // UC-02: Login
    public AuthResponse login(AuthRequest request) {
        // 1. Authenticate using Spring Security Manager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Load User Details (We know user exists now)
        var userDetails = userDetailsService.loadUserByUsername(request.getEmail());

        // 3. Generate Token
        var jwtToken = jwtUtils.generateToken(userDetails);

        return new AuthResponse(jwtToken);
    }
}