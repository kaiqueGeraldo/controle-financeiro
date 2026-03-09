package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalHistory;
import com.controlefinanceiro.api.domain.goal.GoalHistoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.habit.*;
import com.controlefinanceiro.api.domain.habit.dto.CreateHabitDTO;
import com.controlefinanceiro.api.domain.habit.dto.HabitResponseDTO;
import com.controlefinanceiro.api.domain.habit.dto.ToggleHabitDTO;
import com.controlefinanceiro.api.domain.habit.dto.UpdateHabitDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class HabitService {

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private HabitLogRepository habitLogRepository;

    @Autowired
    private GoalHistoryRepository goalHistoryRepository;

    @Autowired
    private GoalRepository goalRepository;

    public List<HabitResponseDTO> listAll(User user) {
        log.info("SERVICE: Listando hábitos para o usuário {}", user.getEmail());
        return habitRepository.findAllByUserIdOrderByOrderIndexAsc(user.getId())
                .stream()
                .map(HabitResponseDTO::new)
                .toList();
    }

    @Transactional
    public HabitResponseDTO create(CreateHabitDTO data, User user) {
        log.info("SERVICE: Criando novo hábito '{}' para usuário {}", data.name(), user.getEmail());

        Habit habit = new Habit();
        habit.setName(data.name());
        habit.setDescription(data.description());
        habit.setIcon(data.icon());
        habit.setColor(data.color());
        habit.setUser(user);

        if (data.goalId() != null) {
            log.info("SERVICE: Vinculando hábito à Meta ID {}", data.goalId());
            Goal goal = goalRepository.findById(data.goalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));
            habit.setGoal(goal);
        }

        Habit saved = habitRepository.save(habit);
        return new HabitResponseDTO(saved);
    }

    @Transactional
    public void toggleHabit(UUID habitId, ToggleHabitDTO data, User user) {
        log.info("SERVICE: Toggle no hábito {} para a data {}", habitId, data.date());

        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Hábito não encontrado"));

        if (!habit.getUser().getId().equals(user.getId())) {
            log.error("SERVICE: Violação de segurança. Usuário {} tentou alterar hábito {}", user.getEmail(), habitId);
            throw new BusinessRuleException("Acesso negado");
        }

        Optional<HabitLog> optLog = habitLogRepository.findByHabitIdAndDate(habitId, data.date());

        HabitLog logEntity = optLog.orElseGet(() -> {
            HabitLog newLog = new HabitLog();
            newLog.setHabit(habit);
            newLog.setDate(data.date());
            newLog.setStatus(HabitStatus.PENDING);
            return newLog;
        });

        String noteMsg = "Check via Hábito: " + habit.getName();
        List<GoalHistory> historicosDeHoje = goalHistoryRepository.findByGoalAndNoteAndDate(
                habit.getGoal() != null ? habit.getGoal().getId() : null,
                noteMsg,
                data.date()
        );

        if (logEntity.getStatus() == HabitStatus.COMPLETED) {
            log.info("SERVICE: Desmarcando hábito. Revertendo estado.");
            logEntity.setStatus(HabitStatus.PENDING);

            if (habit.getFrequency() == HabitFrequency.DAILY) {
                habit.setCurrentStreak(Math.max(0, habit.getCurrentStreak() - 1));
                log.info("SERVICE: Ofensiva reduzida para {}", habit.getCurrentStreak());
            }

            if (habit.getGoal() != null && !historicosDeHoje.isEmpty()) {
                Goal goal = habit.getGoal();
                goalHistoryRepository.deleteAll(historicosDeHoje);

                BigDecimal totalAReduzir = BigDecimal.valueOf(historicosDeHoje.size());
                goal.setCurrentValue(goal.getCurrentValue().subtract(totalAReduzir));
                goalRepository.save(goal);
            }
        } else {
            log.info("SERVICE: Marcando hábito como concluído.");
            logEntity.setStatus(HabitStatus.COMPLETED);

            if (habit.getFrequency() == HabitFrequency.DAILY) {
                habit.setCurrentStreak(habit.getCurrentStreak() + 1);

                if (habit.getCurrentStreak() > habit.getHighestStreak()) {
                    habit.setHighestStreak(habit.getCurrentStreak());
                }
                log.info("SERVICE: Ofensiva incrementada para {}", habit.getCurrentStreak());
            }

            if (habit.getGoal() != null && historicosDeHoje.isEmpty()) {
                Goal goal = habit.getGoal();
                GoalHistory history = new GoalHistory();
                history.setGoal(goal);
                history.setAmount(BigDecimal.ONE);
                history.setNote(noteMsg);
                goalHistoryRepository.save(history);

                goal.setCurrentValue(goal.getCurrentValue().add(BigDecimal.ONE));
                goalRepository.save(goal);
            }
        }

        habitLogRepository.save(logEntity);
        habitRepository.save(habit);
    }

    @Transactional
    public HabitResponseDTO update(UUID id, UpdateHabitDTO data, User user) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hábito não encontrado"));

        if (!habit.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (data.name() != null) habit.setName(data.name());
        if (data.description() != null) habit.setDescription(data.description());
        if (data.icon() != null) habit.setIcon(data.icon());
        if (data.color() != null) habit.setColor(data.color());

        Habit updatedHabit = habitRepository.save(habit);
        return new HabitResponseDTO(updatedHabit);
    }

    @Transactional
    public void delete(UUID id, User user) {
        log.warn("SERVICE: Excluindo hábito {}", id);
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hábito não encontrado"));

        if (!habit.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        habitRepository.delete(habit);
    }

    @Transactional
    public void reorder(List<UUID> orderedIds, User user) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Habit habit = habitRepository.findById(orderedIds.get(i)).orElse(null);
            if (habit != null && habit.getUser().getId().equals(user.getId())) {
                habit.setOrderIndex(i);
                habitRepository.save(habit);
            }
        }
    }
}