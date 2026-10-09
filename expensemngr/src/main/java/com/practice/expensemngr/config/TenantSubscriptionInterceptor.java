package com.practice.expensemngr.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.practice.expensemngr.entity.Tenant;
import com.practice.expensemngr.entity.TenantStatus;
import com.practice.expensemngr.repository.TenantRepository;
import com.practice.expensemngr.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TenantSubscriptionInterceptor implements HandlerInterceptor {

    private final TenantRepository tenantRepository;
    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Skip CORS Pre-flight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // Allow public auth & admin routes without tenant subscription enforcement
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth") || path.startsWith("/auth") || path.startsWith("/api/admin") || path.startsWith("/admin")) {
            return true;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            try {
                String role = jwtUtils.extractRole(jwt);
                if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(role)) {
                    return true; // Super admin bypassed
                }
            } catch (Exception ignored) {}
        }

        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isPresent()) {
                Tenant tenant = tenantOpt.get();
                boolean isInactive = tenant.getStatus() == TenantStatus.SUSPENDED || 
                                     tenant.getStatus() == TenantStatus.CANCELLED || 
                                     (tenant.getExpiresAt() != null && tenant.getExpiresAt().isBefore(Instant.now()));

                if (isInactive) {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                    Map<String, String> errorDetails = new HashMap<>();
                    errorDetails.put("error", "TENANT_ACCOUNT_INACTIVE");
                    errorDetails.put("message", "Subscription expired or suspended for store: " + tenant.getStoreName());

                    response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
                    return false;
                }
            }
        }

        return true;
    }
}
