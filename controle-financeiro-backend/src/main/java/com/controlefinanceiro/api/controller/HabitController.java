package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.habit.dto.CreateHabitDTO;
import com.controlefinanceiro.api.domain.habit.dto.HabitResponseDTO;
import com.controlefinanceiro.api.domain.habit.dto.ToggleHabitDTO;
import com.controlefinanceiro.api.domain.habit.dto.UpdateHabitDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.HabitService;
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
@RequestMapping("/habits")
public class HabitController {

    @Autowired
    private HabitService service;

    @GetMapping
    public ResponseEntity<List<HabitResponseDTO>> listAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listAll(user));
    }

    @PostMapping
    public ResponseEntity<HabitResponseDTO> create(@RequestBody @Valid CreateHabitDTO data, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(data, user));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleHabit(
            @PathVariable UUID id,
            @RequestBody @Valid ToggleHabitDTO data,
            @AuthenticationPrincipal User user) {

        service.toggleHabit(id, data, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody UpdateHabitDTO data,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, data, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorder(
            @RequestBody List<UUID> orderedIds,
            @AuthenticationPrincipal User user) {
        service.reorder(orderedIds, user);
        return ResponseEntity.noContent().build();
    }
}