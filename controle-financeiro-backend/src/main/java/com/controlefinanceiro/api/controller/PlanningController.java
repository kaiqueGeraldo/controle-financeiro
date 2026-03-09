package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import com.controlefinanceiro.api.domain.planning.dto.CreatePlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.MonthlyPlanDTO;
import com.controlefinanceiro.api.domain.planning.dto.PlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.UpdateIncomeDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.PlanningService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/planning")
public class PlanningController {

    @Autowired
    private PlanningService service;

    @GetMapping
    public ResponseEntity<MonthlyPlanDTO> getByMonth(
            @AuthenticationPrincipal User user,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        return ResponseEntity.ok(service.getPlanByMonth(user, month, year));
    }

    @PostMapping
    public ResponseEntity<PlanItemDTO> create(
            @RequestBody @Valid CreatePlanItemDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Novo item no planejamento: {} - Valor: {}", data.description(), data.amount());
        var newItem = service.createItem(data, user);
        return ResponseEntity.ok(newItem);
    }

    @PostMapping("/copy-previous")
    public ResponseEntity<Void> copyPrevious(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> payload) {

        Integer month = payload.get("month");
        Integer year = payload.get("year");

        service.copyFromPreviousMonth(user, month, year);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User user) {

        String statusStr = payload.get("status");
        log.info("API: Alterar status item {} para {}", id, statusStr);

        PlanItemStatus status = PlanItemStatus.valueOf(statusStr);
        service.updateStatus(id, status, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.info("API: Remover item do planejamento {}", id);
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/income")
    public ResponseEntity<Void> updateIncome(
            @RequestBody @Valid UpdateIncomeDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Atualizar renda mensal {}/{} para {}", data.month(), data.year(), data.income());
        service.updateIncomeForecast(user, data);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorder(
            @RequestBody List<UUID> orderedIds,
            @AuthenticationPrincipal User user) {
        service.reorderItems(orderedIds, user);
        return ResponseEntity.noContent().build();
    }
}