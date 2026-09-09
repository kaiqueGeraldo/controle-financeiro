package com.controlefinanceiro.api.utils;

import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DateUtilTest {

    @Test
    void preservesAValidWallTimeIncludingSeconds() {
        assertThat(DateUtil.getTimeOrDefault("23:30:45", LocalTime.NOON))
                .isEqualTo(LocalTime.of(23, 30, 45));
    }

    @Test
    void rejectsAnInvalidWallTimeInsteadOfReplacingItWithServerTime() {
        assertThatThrownBy(() -> DateUtil.getTimeOrDefault("24:00", LocalTime.NOON))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Horário inválido. Use HH:mm ou HH:mm:ss.");
    }

    @Test
    void usesOnlyTheExplicitFallbackWhenWallTimeIsAbsent() {
        assertThat(DateUtil.getTimeOrDefault(null, LocalTime.of(3, 0)))
                .isEqualTo(LocalTime.of(3, 0));
    }
}
