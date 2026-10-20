package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.TimeZone;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

class OnboardingReviewTemporalTest extends OnboardingApplicationSupport {
    @ParameterizedTest
    @ValueSource(strings={"UTC","America/Sao_Paulo","Pacific/Kiritimati"})
    void effectiveJvmZoneCannotChangeCivilOpeningOrProductToday(String zone) throws Exception {
        TimeZone prior=TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone(zone));
            assertThat(ZoneId.systemDefault()).isEqualTo(ZoneId.of(zone));
            when(clock.instant()).thenReturn(Instant.parse("2026-10-10T02:30:00.123456789Z"));
            // In the product zone it is still October9. Browser/JVM may be October10.
            var body=e01();var p=prepare(body);var c=completeCommand(p);var receipt=app.complete(user.getId(),c);
            assertThat(receipt.path("completedAt").asText()).isEqualTo("2026-10-10T02:30:00.123456Z");
            assertThat(sql.queryForList("select opening_date::text from accounts where user_id=?",String.class,user.getId())).containsOnly("2026-10-09");
            assertThat(sql.queryForObject("select deadline::text from goals where user_id=? and title='Reserva'",String.class,user.getId())).isEqualTo("2026-09-30");
            assertThat(app.recover(user.getId(),c.operationId()).path("receipt")).isEqualTo(receipt);
            System.out.println("RC030_EFFECTIVE_ZONE="+ZoneId.systemDefault()+" completedAt="+receipt.path("completedAt").asText());
        }finally{TimeZone.setDefault(prior);}
    }
    @ParameterizedTest
    @ValueSource(strings={"UTC","Pacific/Kiritimati"})
    void futureBaseDateIsJudgedByProductCalendar(String zone) {
        TimeZone prior=TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone(zone));
            when(clock.instant()).thenReturn(Instant.parse("2026-10-10T02:30:00Z"));
            ObjectNode b=minimal();((ObjectNode)b.at("/payload/context")).put("baseDate","2026-10-10");
            save(b);
            assertThatThrownBy(()->app.prepare(user.getId(),command(java.util.UUID.randomUUID())))
                    .isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("AFTER_TODAY");});
        }finally{TimeZone.setDefault(prior);}
    }
}
