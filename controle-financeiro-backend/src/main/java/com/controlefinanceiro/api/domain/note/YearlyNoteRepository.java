package com.controlefinanceiro.api.domain.note;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface YearlyNoteRepository extends JpaRepository<YearlyNote, UUID> {
    Optional<YearlyNote> findByUserIdAndYear(UUID userId, Integer year);
}