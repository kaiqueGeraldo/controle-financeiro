package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.auth.dto.*;
import com.controlefinanceiro.api.domain.user.dto.UserResponseDTO;
import com.controlefinanceiro.api.service.AuthService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @GetMapping("/user")
    public ResponseEntity<UserResponseDTO> getUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            log.warn("API: Tentativa de buscar dados de usuário sem token válido.");
            throw new InsufficientAuthenticationException("Token ausente ou inválido.");
        }

        return ResponseEntity.ok(new UserResponseDTO(
                user.getId(),
                user.getNome(),
                user.getEmail(),
                user.isPrivacyMode(),
                user.isDarkMode(),
                user.isNotifContas(),
                user.isNotifSemanal(),
                user.getDashboardConfig()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO data) {
        try {
            log.info("API: Tentativa de login: {}", data.email());
            var response = authService.login(data);
            return ResponseEntity.ok(response);
        } catch (BusinessRuleException e) {
            log.warn("API: Erro no login para {}: {}", data.email(), e.getMessage());
            throw new BadCredentialsException("Credenciais inválidas.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid RegisterRequestDTO data) {
        log.info("API: Novo registro solicitado: {}", data.email());
        authService.register(data);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/recover-password")
    public ResponseEntity<Void> recoverPassword(@RequestBody @Valid RecoveryRequestDTO data) {
        log.info("API: Recuperação de senha solicitada para {}", data.email());
        authService.recoverPassword(data.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordDTO data) {
        log.info("API: Redefinição de senha com token.");
        authService.resetPassword(data);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        log.info("API: Logout chamado (stateless).");
        return ResponseEntity.ok().build();
    }
}
