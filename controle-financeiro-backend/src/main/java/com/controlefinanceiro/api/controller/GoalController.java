package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.goal.GoalHistory;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.GoalService;
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
@RequestMapping("/goals")
public class GoalController {

    @Autowired
    private GoalService service;

    @GetMapping
    public ResponseEntity<List<GoalResponseDTO>> listAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listAll(user));
    }

    @PostMapping
    public ResponseEntity<GoalResponseDTO> create(@RequestBody @Valid CreateGoalDTO data, @AuthenticationPrincipal User user) {
        log.info("API: Criar Meta '{}' para usuário {}", data.title(), user.getEmail());
        return ResponseEntity.ok(service.create(data, user));
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<Void> deposit(
            @PathVariable UUID id,
            @RequestBody @Valid GoalDepositDTO data,
            @AuthenticationPrincipal User user) {

        log.info("API: Depósito na Meta {}. Valor: {}. Conta Origem: {}", id, data.amount(), data.accountId());
        service.addValue(id, data, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<GoalHistory>> listHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listHistory(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> update(@PathVariable UUID id, @RequestBody UpdateGoalDTO data, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, data, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID targetAccountId,
            @AuthenticationPrincipal User user) {

        log.warn("API: Exclusão de META {}. Conta para Estorno/Devolução: {}", id, targetAccountId);
        service.delete(id, targetAccountId, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/history/{historyId}")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable UUID historyId,
            @RequestParam(required = false) UUID targetAccountId,
            @AuthenticationPrincipal User user) {

        log.warn("API: Exclusão de REGISTRO/APORTE {}. Conta para Estorno: {}", historyId, targetAccountId);
        service.deleteHistory(historyId, targetAccountId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<GoalItemResponseDTO> addItem(
            @PathVariable UUID id,
            @RequestBody @Valid CreateGoalItemDTO data,
            @AuthenticationPrincipal User user) {
        log.warn("API: Criar Item na Meta {}. para usuário: {}", id, user);
        return ResponseEntity.ok(service.addItem(id, data, user));
    }

    @PatchMapping("/items/{itemId}/purchase")
    public ResponseEntity<GoalItemResponseDTO> purchaseItem(
            @PathVariable UUID itemId,
            @RequestBody @Valid PurchaseGoalItemDTO data,
            @AuthenticationPrincipal User user) {
        log.warn("API: Atualizando Item Meta {}. valor pago: {}", itemId, data);
        return ResponseEntity.ok(service.purchaseItem(itemId, data, user));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal User user) {
        service.deleteItem(itemId, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/items/reorder")
    public ResponseEntity<Void> reorderItems(
            @PathVariable UUID id,
            @RequestBody java.util.List<UUID> orderedIds,
            @AuthenticationPrincipal User user) {
        service.reorderItems(id, orderedIds, user);
        return ResponseEntity.noContent().build();
    }
}