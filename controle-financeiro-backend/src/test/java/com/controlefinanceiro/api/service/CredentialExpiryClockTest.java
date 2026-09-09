package com.controlefinanceiro.api.service;

import com.auth0.jwt.JWT;
import com.controlefinanceiro.api.domain.auth.dto.ResetPasswordDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CredentialExpiryClockTest {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final Instant ISSUED_AT = Instant.parse("2026-09-08T02:59:59Z");

    @Test
    void recoveryTokenExpiresAtTheExactBoundaryOfTenMinutes() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        AuthService service = new AuthService();
        User user = user();
        LocalDateTime exactExpiry = LocalDateTime.ofInstant(ISSUED_AT, PRODUCT_ZONE).plusMinutes(10);
        user.setRecoveryToken("123456");
        user.setRecoveryTokenExpiry(exactExpiry);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(user);

        ReflectionTestUtils.setField(service, "userRepository", userRepository);
        ReflectionTestUtils.setField(service, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(ISSUED_AT.plus(10, ChronoUnit.MINUTES), PRODUCT_ZONE));

        assertThatThrownBy(() -> service.resetPassword(
                new ResetPasswordDTO(user.getEmail(), "123456", "nova-senha")
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("O código expirou. Solicite um novo envio.");

        verify(passwordEncoder, never()).encode("nova-senha");
    }

    @Test
    void jwtUsesClockForDurationAndRejectsTheExactExpirationInstant() {
        TokenService tokenService = new TokenService();
        Clock issuedClock = Clock.fixed(ISSUED_AT, PRODUCT_ZONE);
        ReflectionTestUtils.setField(tokenService, "secret", "cf006-test-only-secret-with-at-least-32-characters");
        ReflectionTestUtils.setField(tokenService, "clock", issuedClock);

        User user = user();
        String token = tokenService.generateToken(user);

        assertThat(JWT.decode(token).getExpiresAtAsInstant()).isEqualTo(ISSUED_AT.plus(24, ChronoUnit.HOURS));

        ReflectionTestUtils.setField(tokenService, "clock", Clock.fixed(
                ISSUED_AT.plus(24, ChronoUnit.HOURS).minusSeconds(1), PRODUCT_ZONE));
        assertThat(tokenService.validateToken(token)).isEqualTo(user.getEmail());

        ReflectionTestUtils.setField(tokenService, "clock", Clock.fixed(
                ISSUED_AT.plus(24, ChronoUnit.HOURS), PRODUCT_ZONE));
        assertThat(tokenService.validateToken(token)).isEmpty();
    }

    private static User user() {
        User user = new User();
        user.setId(UUID.fromString("30000000-0000-0000-0000-000000000001"));
        user.setNome("Usuário temporal");
        user.setEmail("credencial@example.test");
        user.setSenha("hash");
        return user;
    }
}
