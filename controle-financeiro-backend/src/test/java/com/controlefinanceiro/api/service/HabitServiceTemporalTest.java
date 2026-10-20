package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalHistory;
import com.controlefinanceiro.api.domain.goal.GoalHistoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.goal.GoalType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import com.controlefinanceiro.api.domain.habit.Habit;
import com.controlefinanceiro.api.domain.habit.HabitFrequency;
import com.controlefinanceiro.api.domain.habit.HabitLog;
import com.controlefinanceiro.api.domain.habit.HabitLogRepository;
import com.controlefinanceiro.api.domain.habit.HabitRepository;
import com.controlefinanceiro.api.domain.habit.dto.ToggleHabitDTO;
import com.controlefinanceiro.api.domain.user.User;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HabitServiceTemporalTest {

    @Test
    void explicitHabitDayStaysCivilWhileHistoryUsesProductClock() {
        HabitRepository habitRepository = mock(HabitRepository.class);
        HabitLogRepository habitLogRepository = mock(HabitLogRepository.class);
        GoalHistoryRepository historyRepository = mock(GoalHistoryRepository.class);
        GoalRepository goalRepository = mock(GoalRepository.class);
        HabitService service = new HabitService();
        org.springframework.test.util.ReflectionTestUtils.setField(service,"inventoryGuard",org.mockito.Mockito.mock(FinancialInventoryGuard.class));
        User user = new User();
        user.setId(UUID.fromString("60000000-0000-0000-0000-000000000001"));
        Goal goal = new Goal();
        goal.setId(UUID.fromString("60000000-0000-0000-0000-000000000002"));
        goal.setCurrentValue(BigDecimal.ZERO);
        goal.setType(GoalType.NUMERIC);
        goal.setUser(user);
        Habit habit = new Habit();
        habit.setId(UUID.fromString("60000000-0000-0000-0000-000000000003"));
        habit.setName("Hábito sintético");
        habit.setFrequency(HabitFrequency.DAILY);
        habit.setCurrentStreak(0);
        habit.setHighestStreak(0);
        habit.setUser(user);
        habit.setGoal(goal);
        LocalDate clickedDay = LocalDate.of(2026, 9, 6);

        when(habitRepository.findForUpdate(habit.getId())).thenReturn(Optional.of(habit));
        EntityManager entityManager = mock(EntityManager.class);
        when(entityManager.find(Goal.class, goal.getId(), LockModeType.PESSIMISTIC_WRITE)).thenReturn(goal);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        UUID historyId = UUID.fromString("60000000-0000-0000-0000-000000000004");
        when(historyRepository.save(any())).thenAnswer(invocation -> {
            GoalHistory saved = invocation.getArgument(0); saved.setId(historyId); return saved;
        });
        when(habitLogRepository.findByHabitIdAndDate(habit.getId(), clickedDay)).thenReturn(Optional.empty());
        ReflectionTestUtils.setField(service, "habitRepository", habitRepository);
        ReflectionTestUtils.setField(service, "habitLogRepository", habitLogRepository);
        ReflectionTestUtils.setField(service, "goalHistoryRepository", historyRepository);
        ReflectionTestUtils.setField(service, "goalRepository", goalRepository);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T02:59:59Z"), ZoneId.of("America/Sao_Paulo")));

        service.toggleHabit(habit.getId(), new ToggleHabitDTO(clickedDay), user);

        ArgumentCaptor<HabitLog> logCaptor = ArgumentCaptor.forClass(HabitLog.class);
        verify(habitLogRepository).saveAndFlush(logCaptor.capture());
        assertThat(logCaptor.getValue().getDate()).isEqualTo(clickedDay);
        assertThat(logCaptor.getValue().getGoalHistoryId()).isEqualTo(historyId);
        assertThat(logCaptor.getValue().getStatus()).isEqualTo(com.controlefinanceiro.api.domain.habit.HabitStatus.COMPLETED);
        assertThat(goal.getCurrentValue()).isEqualByComparingTo("1");

        ArgumentCaptor<GoalHistory> historyCaptor = ArgumentCaptor.forClass(GoalHistory.class);
        verify(historyRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getDate())
                .isEqualTo(LocalDateTime.of(2026, 9, 7, 23, 59, 59));
    }
}
