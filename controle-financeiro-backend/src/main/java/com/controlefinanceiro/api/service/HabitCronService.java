package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.habit.*;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class HabitCronService {

    @Autowired private HabitRepository habitRepository;
    @Autowired private HabitLogRepository habitLogRepository;
    @Autowired private TransactionTemplate transactionTemplate;

    @Scheduled(cron = "0 5 0 * * ?", zone = "America/Sao_Paulo")
    @SchedulerLock(name = "processDailyHabitsLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void processDailyHabits() {
        log.info("CRON-HABITS: Iniciando processamento de Hábitos (Daily e Weekly Goals)...");

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate dayBefore = yesterday.minusDays(1);

        boolean isEndOfWeek = (yesterday.getDayOfWeek() == DayOfWeek.SUNDAY);
        LocalDate startOfLastWeek = yesterday.minusDays(6);

        int page = 0;
        int size = 500;
        Page<Habit> habitPage;

        do {
            habitPage = habitRepository.findAll(PageRequest.of(page, size));
            List<Habit> habitsBatch = habitPage.getContent();

            if (habitsBatch.isEmpty()) break;

            List<UUID> habitIds = habitsBatch.stream().map(Habit::getId).toList();
            List<HabitLog> batchLogs = habitLogRepository.findLogsForHabitsInDates(habitIds, yesterday, dayBefore);

            transactionTemplate.execute(status -> {
                for (Habit habit : habitsBatch) {
                    try {
                        switch (habit.getFrequency()) {
                            case DAILY:
                                processDailyRule(habit, batchLogs, yesterday, dayBefore);
                                break;
                            case WEEKLY_GOAL:
                                if (isEndOfWeek) {
                                    processWeeklyRule(habit, startOfLastWeek, yesterday);
                                }
                                break;
                        }
                    } catch (Exception e) {
                        log.error("CRON-HABITS: Erro ao processar o hábito ID {}", habit.getId(), e);
                    }
                }
                return null;
            });

            page++;
        } while (habitPage.hasNext());

        log.info("CRON-HABITS: Processamento finalizado de forma otimizada.");
    }

    private void processDailyRule(Habit habit, List<HabitLog> batchLogs, LocalDate yesterday, LocalDate dayBefore) {
        Optional<HabitLog> yesterdayLog = batchLogs.stream()
                .filter(l -> l.getHabit().getId().equals(habit.getId()) && l.getDate().equals(yesterday))
                .findFirst();

        if (yesterdayLog.isPresent() && yesterdayLog.get().getStatus() != HabitStatus.PENDING) {
            return;
        }

        HabitStatus statusForYesterday = HabitStatus.FAILED;

        Optional<HabitLog> dayBeforeLog = batchLogs.stream()
                .filter(l -> l.getHabit().getId().equals(habit.getId()) && l.getDate().equals(dayBefore))
                .findFirst();

        if (dayBeforeLog.isPresent() && dayBeforeLog.get().getStatus() == HabitStatus.COMPLETED) {
            log.debug("CRON-HABITS: Perdão automático aplicado ao hábito ID {}", habit.getId());
            statusForYesterday = HabitStatus.SKIPPED;
        } else {
            log.debug("CRON-HABITS: Regra quebrada. Zerando ofensiva do hábito ID {}", habit.getId());
            habit.setCurrentStreak(0);
            habitRepository.save(habit);
        }

        HabitLog logToSave = yesterdayLog.orElseGet(HabitLog::new);
        logToSave.setHabit(habit);
        logToSave.setDate(yesterday);
        logToSave.setStatus(statusForYesterday);

        habitLogRepository.save(logToSave);
    }

    private void processWeeklyRule(Habit habit, LocalDate startDate, LocalDate endDate) {
        if (habit.getWeeklyGoal() == null || habit.getWeeklyGoal() <= 0) return;

        long completedCount = habitLogRepository.countCompletedLogsBetween(habit.getId(), startDate, endDate);

        if (completedCount >= habit.getWeeklyGoal()) {
            habit.setCurrentStreak(habit.getCurrentStreak() + 1);
            if (habit.getCurrentStreak() > habit.getHighestStreak()) {
                habit.setHighestStreak(habit.getCurrentStreak());
            }
            log.debug("CRON-HABITS: Meta semanal atingida para ID {}. Ofensiva atual: {}", habit.getId(), habit.getCurrentStreak());
        } else {
            habit.setCurrentStreak(0);
            log.debug("CRON-HABITS: Meta semanal FALHOU para ID {}. Ofensiva zerada.", habit.getId());
        }

        habitRepository.save(habit);
    }
}