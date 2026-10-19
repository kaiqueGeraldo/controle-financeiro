package com.controlefinanceiro.api.infra.exception;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
public class RestSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final JsonMapper jsonMapper;

    public RestSecurityErrorHandler(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        writeProblem(
                request,
                response,
                HttpServletResponse.SC_UNAUTHORIZED,
                "Autenticação necessária",
                "Autenticação necessária para acessar este recurso."
        );
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException exception) throws IOException, ServletException {
        writeProblem(
                request,
                response,
                HttpServletResponse.SC_FORBIDDEN,
                "Operação proibida",
                "Operação não permitida."
        );
    }

    private void writeProblem(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            String error,
            String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        if (request.getRequestURI().equals("/onboarding") || request.getRequestURI().startsWith("/onboarding/")) {
            jsonMapper.writeValue(response.getOutputStream(), java.util.Map.of("error", java.util.Map.of(
                    "code", status == 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
                    "message", message, "fieldErrors", java.util.List.of())));
            return;
        }
        jsonMapper.writeValue(
                response.getOutputStream(),
                new StandardError(Instant.now(), status, error, message, request.getRequestURI())
        );
    }
}
