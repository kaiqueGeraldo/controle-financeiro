package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.transaction.dto.UpdateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.TransactionService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionService service;

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> create(@RequestBody @Valid CreateTransactionDTO data, @AuthenticationPrincipal User user) {
        log.info("API: Requisição para CRIAR transação. Usuário: {} | Valor: {} | Tipo: {}", user.getEmail(), data.amount(), data.type());
        var newTransaction = service.create(data, user);
        return ResponseEntity.ok(newTransaction);
    }

    @GetMapping
    public ResponseEntity<Page<TransactionResponseDTO>> listAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID accountId,
            @PageableDefault(size = 30, sort = {"date", "createdAt"}, direction = Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("API: Requisição para LISTAR transações filtradas. Usuário: {} | Mês: {} | Conta: {}",
                user.getEmail(), month, accountId);

        var transactions = service.listAllFiltered(user, month, year, type, accountId, pageable);
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody UpdateTransactionDTO data,
            @AuthenticationPrincipal User user
    ) {
        log.info("API: Requisição para ATUALIZAR transação {}. Usuário: {}", id, user.getEmail());
        var updatedTransaction = service.update(id, data, user);
        return ResponseEntity.ok(updatedTransaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.warn("API: Requisição para EXCLUIR transação {}. Usuário: {}", id, user.getEmail());
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportToExcel(@AuthenticationPrincipal User user) {
        log.info("API: Exportando extrato em Excel. Usuário: {}", user.getEmail());
        byte[] excelData = service.exportToExcel(user);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"extrato.xlsx\"")
                .body(excelData);
    }
}