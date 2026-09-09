package com.controlefinanceiro.api.utils;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

class TemporalConfigTest {

    @Test
    void productCalendarUsesSaoPauloRegardlessOfJvmDefaultZone() {
        TimeZone original = TimeZone.getDefault();
        try {
            for (String jvmZone : new String[]{"UTC", "America/Sao_Paulo", "Pacific/Kiritimati"}) {
                TimeZone.setDefault(TimeZone.getTimeZone(jvmZone));
                ZoneId productZone = new TemporalConfig().productZoneId(TemporalConfig.DEFAULT_PRODUCT_ZONE);
                // Observe the clock bean used by services, not only a test-owned clock.
                assertThat(new TemporalConfig().productClock(productZone).getZone())
                        .isEqualTo(ZoneId.of("America/Sao_Paulo"));
                Clock beforeMidnight = Clock.fixed(Instant.parse("2026-09-08T02:59:59Z"), productZone);
                Clock atMidnight = Clock.fixed(Instant.parse("2026-09-08T03:00:00Z"), productZone);

                assertThat(productZone).isEqualTo(ZoneId.of("America/Sao_Paulo"));
                assertThat(LocalDate.now(beforeMidnight)).isEqualTo(LocalDate.of(2026, 9, 7));
                assertThat(LocalDate.now(atMidnight)).isEqualTo(LocalDate.of(2026, 9, 8));
            }
        } finally {
            TimeZone.setDefault(original);
        }
    }
}
