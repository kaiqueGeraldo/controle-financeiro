package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.habit.*;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class HabitCronService {
    @Autowired private HabitRepository habitRepository;
    @Autowired private HabitLogRepository habitLogRepository;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private Clock clock;

    @Scheduled(cron = "0 5 0 * * ?", zone = "${app.temporal.product-zone}")
    @SchedulerLock(name = "processDailyHabitsLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void processDailyHabits() {
        LocalDate today = LocalDate.now(clock);
        UUID after = null;
        int failures = 0;
        List<UUID> ids;
        do {
            // Keyset pagination avoids offset shifts when habits are deleted.
            ids = after == null ? habitRepository.findFirstIds(PageRequest.of(0, 500))
                    : habitRepository.findIdsAfter(after, PageRequest.of(0, 500));
            for (UUID id : ids) {
                try {
                    transactionTemplate.executeWithoutResult(status -> processHabit(id, today));
                } catch (RuntimeException exception) {
                    // Catch outside the transaction: one failure cannot poison its batch.
                    failures++;
                    log.error("CRON-HABITS: Falha no hábito {}", id, exception);
                }
            }
            if (!ids.isEmpty()) after = ids.getLast();
        } while (ids.size() == 500);
        if (failures > 0) throw new IllegalStateException("Falha ao processar " + failures + " hábito(s)");
    }

    private void processHabit(UUID id, LocalDate today) {
        Habit habit = habitRepository.findForUpdate(id).orElse(null);
        if (habit == null) return; // Deleted since the ID page was read.
        LocalDate yesterday = today.minusDays(1);
        if (habit.getFrequency() == HabitFrequency.DAILY) {
            HabitLog entry = habitLogRepository.findByHabitIdAndDate(id, yesterday).orElseGet(() -> {
                HabitLog created = new HabitLog();
                created.setHabit(habit);
                created.setDate(yesterday);
                created.setStatus(HabitStatus.PENDING);
                return created;
            });
            if (entry.getStatus() != HabitStatus.COMPLETED) {
                boolean forgiven = habitLogRepository.findByHabitIdAndDate(id, yesterday.minusDays(1))
                        .map(previous -> previous.getStatus() == HabitStatus.COMPLETED).orElse(false);
                entry.setStatus(forgiven ? HabitStatus.SKIPPED : HabitStatus.FAILED);
                habitLogRepository.saveAndFlush(entry);
            }
        }
        LocalDate calculationDay = HabitStreakCalculator.calendarDay(habit, today);
        List<HabitLog> logs = habitLogRepository.findAllByHabitIdAndDateLessThanEqualOrderByDateAsc(id, calculationDay);
        HabitStreakCalculator.apply(habit, logs, today);
        habitRepository.save(habit);
    }
}
