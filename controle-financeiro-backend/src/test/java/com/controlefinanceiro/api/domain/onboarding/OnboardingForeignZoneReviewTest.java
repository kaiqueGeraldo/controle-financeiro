package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import java.util.TimeZone;
import java.time.ZoneId;
import static org.assertj.core.api.Assertions.*;

/** Application startup resets JVM timezone. Override AFTER startup, only for these probes. */
class OnboardingForeignZoneReviewTest extends OnboardingIntegrationTest {
    private TimeZone previous;
    @BeforeEach void useEffectiveForeignZone() {
        previous=TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("Pacific/Kiritimati"));
        assertThat(ZoneId.systemDefault()).isEqualTo(ZoneId.of("Pacific/Kiritimati"));
    }
    @AfterEach void restoreZone() {if(previous!=null) TimeZone.setDefault(previous);}
    @Test void effectiveZoneIsRecorded() {
        System.out.println("CF029_REVIEW_EFFECTIVE_ZONE="+ZoneId.systemDefault());
        assertThat(ZoneId.systemDefault().getRules().getOffset(java.time.Instant.parse("2026-10-18T15:00:00Z")).getTotalSeconds()).isEqualTo(14*3600);
    }
}
