package com.practice.expensemngr.config;

import com.practice.expensemngr.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TenantSecurityFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                try {
                    UUID jwtTenantId = jwtUtils.extractTenantId(jwt);
                    String role = jwtUtils.extractRole(jwt);
                    String impersonateHeader = request.getHeader("X-Tenant-Id");

                    if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role) && impersonateHeader != null && !impersonateHeader.isEmpty()) {
                        TenantContext.setCurrentTenant(UUID.fromString(impersonateHeader));
                    } else if (jwtTenantId != null) {
                        TenantContext.setCurrentTenant(jwtTenantId);
                    }
                } catch (Exception e) {
                    // Invalid token or tenant parsing error - continue chain
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
