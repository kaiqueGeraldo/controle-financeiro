package com.controlefinanceiro.api;

import com.auth0.jwt.JWT;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@Import(TemporalBrowserApiPostgresE2E.FixedClockConfiguration.class)
class HarnessCredentialClockTest extends PostgresIntegrationTest {
    @Autowired TokenService tokens;
    @Autowired Clock businessClock;

    @Test void harnessIssuesAtAuthNowAfterTheOldFixedExpiryAndStillExpiresExactly() {
        assertThat(businessClock.instant()).isEqualTo(Instant.parse("2027-01-31T05:00:00Z"));
        User user = new User(); user.setId(UUID.randomUUID()); user.setNome("Sintético"); user.setEmail("clock@example.test");
        String token = tokens.generateToken(user);
        Instant expires = JWT.decode(token).getExpiresAtAsInstant();
        assertThat(expires).isEqualTo(Instant.parse("2027-02-03T05:00:00Z"));
        Clock authClock = (Clock) ReflectionTestUtils.getField(tokens, "clock");
        assertThat(authClock.instant()).isEqualTo(Instant.parse("2027-02-02T05:00:00Z"));
        try {
            assertThat(tokens.validateToken(token)).isEqualTo(user.getEmail());
            ReflectionTestUtils.setField(tokens, "clock", Clock.fixed(expires.minusSeconds(1), ZoneId.of("UTC")));
            assertThat(tokens.validateToken(token)).isEqualTo(user.getEmail());
            ReflectionTestUtils.setField(tokens, "clock", Clock.fixed(expires, ZoneId.of("UTC")));
            assertThat(tokens.validateToken(token)).isEmpty();
        } finally { ReflectionTestUtils.setField(tokens, "clock", authClock); }
    }
}
