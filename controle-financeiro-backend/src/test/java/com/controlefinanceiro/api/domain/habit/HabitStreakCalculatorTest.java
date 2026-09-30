package com.controlefinanceiro.api.domain.habit;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class HabitStreakCalculatorTest {
    @Test void leapDayForgivenessAndSecondAbsence() {
        var completed = log("2024-02-28", HabitStatus.COMPLETED);
        assertThat(HabitStreakCalculator.daily(List.of(completed), LocalDate.parse("2024-03-01")))
                .isEqualTo(new HabitStreakCalculator.Streak(1, 1));
        assertThat(HabitStreakCalculator.daily(List.of(completed), LocalDate.parse("2024-03-02")))
                .isEqualTo(new HabitStreakCalculator.Streak(0, 1));
    }

    @Test void absenceMarkersAndUnmarkedClosedDaysDoNotAddPoints() {
        var logs = List.of(log("2026-12-31", HabitStatus.COMPLETED), log("2027-01-01", HabitStatus.SKIPPED),
                log("2027-01-02", HabitStatus.PENDING), log("2027-01-03", HabitStatus.COMPLETED));
        assertThat(HabitStreakCalculator.daily(logs, LocalDate.parse("2027-01-03")))
                .isEqualTo(new HabitStreakCalculator.Streak(1, 1));
    }

    @Test void todayPendingIsStillOpenAndFutureLegacyLogIsExcluded() {
        var logs = List.of(log("2027-01-03", HabitStatus.COMPLETED), log("2027-01-04", HabitStatus.PENDING),
                log("2027-01-05", HabitStatus.COMPLETED));
        assertThat(HabitStreakCalculator.daily(logs, LocalDate.parse("2027-01-04")))
                .isEqualTo(new HabitStreakCalculator.Streak(1, 1));
    }

    @Test void noLogsMeansNoFabricatedStreak() {
        assertThat(HabitStreakCalculator.daily(List.of(), LocalDate.parse("2027-01-04")))
                .isEqualTo(new HabitStreakCalculator.Streak(0, 0));
        assertThat(HabitStreakCalculator.weekly(List.of(), LocalDate.parse("2027-01-04"), 2))
                .isEqualTo(new HabitStreakCalculator.Streak(0, 0));
    }

    @Test void closedWeekCountsMondayAndSundayAndExcludesOpenMonday() {
        var logs = List.of(log("2026-12-28", HabitStatus.COMPLETED), log("2027-01-03", HabitStatus.COMPLETED),
                log("2027-01-04", HabitStatus.COMPLETED));
        assertThat(HabitStreakCalculator.weekly(logs, LocalDate.parse("2027-01-04"), 2))
                .isEqualTo(new HabitStreakCalculator.Streak(1, 1));
        assertThat(HabitStreakCalculator.weekly(logs, LocalDate.parse("2027-01-11"), 2))
                .isEqualTo(new HabitStreakCalculator.Streak(0, 1));
    }

    @Test void missingEntireWeekBreaksWeeklyChain() {
        var logs = List.of(log("2026-12-14", HabitStatus.COMPLETED), log("2026-12-20", HabitStatus.COMPLETED),
                log("2026-12-28", HabitStatus.COMPLETED), log("2027-01-03", HabitStatus.COMPLETED));
        assertThat(HabitStreakCalculator.weekly(logs, LocalDate.parse("2027-01-04"), 2))
                .isEqualTo(new HabitStreakCalculator.Streak(1, 1));
    }

    @Test void consecutiveClosedWeeksCountEvenAcrossYearBoundary() {
        var logs = List.of(log("2026-12-21", HabitStatus.COMPLETED), log("2026-12-27", HabitStatus.COMPLETED),
                log("2026-12-28", HabitStatus.COMPLETED), log("2027-01-03", HabitStatus.COMPLETED));
        assertThat(HabitStreakCalculator.weekly(logs, LocalDate.parse("2027-01-04"), 2))
                .isEqualTo(new HabitStreakCalculator.Streak(2, 2));
    }

    private HabitLog log(String day, HabitStatus status) {
        HabitLog log = new HabitLog(); log.setDate(LocalDate.parse(day)); log.setStatus(status); return log;
    }
}
