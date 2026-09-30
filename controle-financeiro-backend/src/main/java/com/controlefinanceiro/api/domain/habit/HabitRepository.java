package com.controlefinanceiro.api.domain.habit;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from Habit h where h.id = :id")
    Optional<Habit> findForUpdate(UUID id);

    @Query("select h.id from Habit h order by h.id")
    List<UUID> findFirstIds(Pageable page);

    @Query("select h.id from Habit h where h.id > :after order by h.id")
    List<UUID> findIdsAfter(UUID after, Pageable page);

    @EntityGraph(attributePaths = "logs")
    List<Habit> findAllByUserIdOrderByOrderIndexAsc(UUID userId);
}
