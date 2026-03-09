package com.controlefinanceiro.api.domain.category;

import com.controlefinanceiro.api.domain.category.dto.CategoryResponseDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findAllByUserId(UUID userId);
    List<Category> findByType(TransactionType type);
    List<CategoryResponseDTO> findAllByUserIdAndType(UUID userId, TransactionType type);
    Optional<Category> findByUserIdAndName(UUID userId, String name);
}