package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.dto.CategoryResponseDTO;
import com.controlefinanceiro.api.domain.category.dto.CreateCategoryDTO;
import com.controlefinanceiro.api.domain.planning.PlanItem;
import com.controlefinanceiro.api.domain.planning.PlanItemRepository;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PlanItemRepository planItemRepository;

    public CategoryResponseDTO create(CreateCategoryDTO data, User user) {
        log.info("Criando categoria: {}", data.name());
        Category category = new Category();
        category.setName(data.name());
        category.setIcon(data.icon());
        category.setColor(data.color());
        category.setType(data.type());
        category.setUser(user);

        Category saved = repository.save(category);
        return new CategoryResponseDTO(saved);
    }

    public CategoryResponseDTO update(UUID id, CreateCategoryDTO data, User user) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        category.setName(data.name());
        category.setIcon(data.icon());
        category.setColor(data.color());
        category.setType(data.type());

        Category updatedCategory = repository.save(category);
        return new CategoryResponseDTO(updatedCategory);
    }

    public List<CategoryResponseDTO> listAll(User user) {
        return repository.findAllByUserId(user.getId())
                .stream()
                .map(CategoryResponseDTO::new)
                .toList();
    }

    public List<CategoryResponseDTO> listByType(User user, TransactionType type) {
        return repository.findAllByUserIdAndType(user.getId(), type);
    }

    @Transactional
    public void delete(UUID id, User user) {
        log.warn("Excluindo categoria ID {}", id);
        Category category = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (category.isSystemReserved()) {
            throw new BusinessRuleException("Esta é uma categoria vital do sistema e não pode ser excluída.");
        }

        List<PlanItem> planItems = planItemRepository.findAllByCategoryId(id);
        if (!planItems.isEmpty()) {
            planItems.forEach(p -> p.setCategory(null));
            planItemRepository.saveAll(planItems);
        }

        List<Transaction> transactions = transactionRepository.findAllByCategoryId(id);
        if (!transactions.isEmpty()) {
            log.info("Desvinculando {} transações da categoria excluída.", transactions.size());
            for (Transaction t : transactions) {
                t.setCategory(null);
            }
            transactionRepository.saveAll(transactions);
        }

        repository.delete(category);
    }
}