package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.account.dto.AccountResponseDTO;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.account.dto.UpdateAccountDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.AccountService;
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
@RequestMapping("/accounts")
public class AccountController {

    @Autowired
    private AccountService service;

    @PostMapping
    public ResponseEntity<AccountResponseDTO> create(@RequestBody @Valid CreateAccountDTO data, @AuthenticationPrincipal User user) {
        log.info("API: Criar Conta '{}'. Usuário: {}", data.name(), user.getEmail());
        var newAccount = service.create(data, user);
        return ResponseEntity.ok(newAccount);
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> listAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listAll(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateAccountDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Atualizar Conta {}", id);
        var updatedAccount = service.update(id, data, user);
        return ResponseEntity.ok(updatedAccount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.warn("API: Excluir Conta {}. Usuário: {}", id, user.getEmail());
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