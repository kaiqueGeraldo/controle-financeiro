package com.controlefinanceiro.api.domain.validation;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class FutureInProductZoneValidatorTest {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("America/Sao_Paulo");

    @Test
    void deadlineBoundaryFollowsProductMidnight() {
        LocalDate deadline = LocalDate.of(2026, 9, 8);
        FutureInProductZoneValidator beforeMidnight = validatorAt("2026-09-08T02:59:59Z");
        FutureInProductZoneValidator atMidnight = validatorAt("2026-09-08T03:00:00Z");

        assertThat(beforeMidnight.isValid(deadline, null)).isTrue();
        assertThat(atMidnight.isValid(deadline, null)).isFalse();
    }

    @Test
    void leapDayIsValidWhenItIsTheNextProductDay() {
        FutureInProductZoneValidator validator = validatorAt("2024-02-28T15:00:00Z");

        assertThat(validator.isValid(LocalDate.of(2024, 2, 29), null)).isTrue();
    }

    private static FutureInProductZoneValidator validatorAt(String instant) {
        return new FutureInProductZoneValidator(Clock.fixed(Instant.parse(instant), PRODUCT_ZONE));
    }
}
