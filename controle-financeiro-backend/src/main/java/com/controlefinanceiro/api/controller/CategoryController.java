package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.category.dto.CategoryResponseDTO;
import com.controlefinanceiro.api.domain.category.dto.CreateCategoryDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.CategoryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryService service;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> create(@RequestBody @Valid CreateCategoryDTO data, @AuthenticationPrincipal User user) {
        log.info("API: Criar Categoria '{}'", data.name());
        var newCategory = service.create(data, user);
        return ResponseEntity.ok(newCategory);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> listAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) TransactionType type
    ) {
        List<CategoryResponseDTO> categories;
        if (type != null) {
            categories = service.listByType(user, type);
        } else {
            categories = service.listAll(user);
        }
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody @Valid CreateCategoryDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Atualizar Categoria {}", id);
        var updatedCategory = service.update(id, data, user);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.warn("API: Excluir Categoria {}", id);
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}