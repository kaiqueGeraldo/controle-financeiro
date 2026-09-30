package com.controlefinanceiro.api.domain.habit;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Derives streaks from civil days, including corrections and missing days. */
public final class HabitStreakCalculator {
    private HabitStreakCalculator() {}

    public record Streak(int current, int highest) {}

    /** Input is unique by day and sorted ascending, limited to today. O(logs). */
    public static Streak daily(List<HabitLog> logs, LocalDate today) {
        int current = 0;
        int highest = 0;
        LocalDate previousDay = null;
        boolean previousCompleted = false;
        for (HabitLog entry : logs) {
            if (entry.getDate().isAfter(today)) continue;
            if (entry.getDate().equals(today) && entry.getStatus() != HabitStatus.COMPLETED) continue;
            if (previousDay != null) {
                long missing = ChronoUnit.DAYS.between(previousDay, entry.getDate()) - 1;
                if (missing > 1 || (missing == 1 && !previousCompleted)) current = 0;
                if (missing > 0) previousCompleted = false;
            }
            if (entry.getStatus() == HabitStatus.COMPLETED) {
                current++;
                highest = Math.max(highest, current);
                previousCompleted = true;
            } else {
                // All non-completions on a closed day are absences. Re-evaluate
                // derived SKIPPED/FAILED after a retroactive neighboring check.
                if (!previousCompleted) current = 0;
                previousCompleted = false;
            }
            previousDay = entry.getDate();
        }
        if (previousDay != null) {
            long missing = ChronoUnit.DAYS.between(previousDay, today.minusDays(1));
            if (missing > 1 || (missing == 1 && !previousCompleted)) current = 0;
        }
        return new Streak(current, highest);
    }

    /** Monday-Sunday closed weeks; O(logs log weeks), space O(weeks). */
    public static Streak weekly(List<HabitLog> logs, LocalDate today, int goal) {
        LocalDate openWeek = monday(today);
        Map<LocalDate, Integer> counts = new TreeMap<>();
        for (HabitLog entry : logs) {
            LocalDate week = monday(entry.getDate());
            if (entry.getStatus() == HabitStatus.COMPLETED && week.isBefore(openWeek)) {
                counts.merge(week, 1, Integer::sum);
            }
        }
        int current = 0;
        int highest = 0;
        LocalDate previousWeek = null;
        for (var entry : counts.entrySet()) {
            if (previousWeek != null && !entry.getKey().equals(previousWeek.plusWeeks(1))) current = 0;
            current = entry.getValue() >= goal ? current + 1 : 0;
            highest = Math.max(highest, current);
            previousWeek = entry.getKey();
        }
        if (previousWeek == null || !previousWeek.equals(openWeek.minusWeeks(1))) current = 0;
        return new Streak(current, highest);
    }

    public static void apply(Habit habit, List<HabitLog> logs, LocalDate today) {
        today = calendarDay(habit, today);
        Streak result;
        if (habit.getFrequency() == HabitFrequency.WEEKLY_GOAL) {
            if (habit.getWeeklyGoal() == null || habit.getWeeklyGoal() < 1 || habit.getWeeklyGoal() > 7) {
                throw new IllegalStateException("Meta semanal deve estar entre 1 e 7");
            }
            result = weekly(logs, today, habit.getWeeklyGoal());
        } else {
            result = daily(logs, today);
        }
        habit.setCurrentStreak(result.current());
        habit.setHighestStreak(result.highest());
        habit.setStreakAsOf(today);
    }

    public static LocalDate calendarDay(Habit habit, LocalDate requestedDay) {
        LocalDate previous = habit.getStreakAsOf();
        return previous != null && previous.isAfter(requestedDay) ? previous : requestedDay;
    }

    private static LocalDate monday(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
