package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.planning.dto.CopyPreviousPlanDTO;
import com.controlefinanceiro.api.domain.planning.dto.UpdatePlanStatusDTO;
import com.controlefinanceiro.api.domain.planning.dto.CreatePlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.MonthlyPlanDTO;
import com.controlefinanceiro.api.domain.planning.dto.PlanItemDTO;
import com.controlefinanceiro.api.domain.planning.dto.UpdateIncomeDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.PlanningService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
            @RequestParam @Min(1) @Max(12) Integer month,
            @RequestParam @Min(1) @Max(9999) Integer year) {
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
            @RequestBody @Valid CopyPreviousPlanDTO payload) {
        service.copyFromPreviousMonth(user, payload.month(), payload.year());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePlanStatusDTO payload,
            @AuthenticationPrincipal User user) {

        log.info("API: Alterar status item {} para {}", id, payload.status());
        service.updateStatus(id, payload.status(), user);
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
