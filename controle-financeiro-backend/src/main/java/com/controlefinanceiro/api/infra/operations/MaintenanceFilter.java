package com.controlefinanceiro.api.infra.operations;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public final class MaintenanceFilter extends OncePerRequestFilter {
    private final OperationsState operations;
    public MaintenanceFilter(OperationsState operations) { this.operations = operations; }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                              FilterChain chain) throws ServletException, IOException {
        String path = request.getServletPath();
        boolean probe = "GET".equals(request.getMethod()) &&
                (path.equals("/ops/health/liveness") || path.equals("/ops/health/readiness"));
        if (operations.writersEnabled() || probe) {
            chain.doFilter(request, response);
            return;
        }
        // Reads are also closed: planning GET and future read paths can write.
        response.setStatus(503);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Retry-After", "60");
        response.getWriter().write("{\"message\":\"Aplicação em manutenção. Tente novamente mais tarde.\"}");
    }
}
