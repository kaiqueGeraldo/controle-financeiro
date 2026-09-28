package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.transaction.dto.UpdateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.SettleTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.CashSummaryDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.TransactionService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import org.springframework.web.bind.MissingServletRequestParameterException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
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
    public ResponseEntity<PagedModel<TransactionResponseDTO>> listAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @Min(1) @Max(12) Integer month,
            @RequestParam(required = false) @Min(1) @Max(9999) Integer year,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID accountId,
            @PageableDefault(size = 30, sort = {"date", "createdAt"}, direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request
    ) throws MissingServletRequestParameterException {
        if (month == null && request.getParameter("month") != null) {
            throw new MissingServletRequestParameterException("month", "Integer");
        }
        if (year == null && request.getParameter("year") != null) {
            throw new MissingServletRequestParameterException("year", "Integer");
        }
        if ((month == null) != (year == null)) {
            throw new MissingServletRequestParameterException(month == null ? "month" : "year", "Integer");
        }
        log.info("API: Requisição para LISTAR transações filtradas. Usuário: {} | Mês: {} | Conta: {}",
                user.getEmail(), month, accountId);

        var transactions = service.listAllFiltered(user, month, year, type, accountId, pageable);
        return ResponseEntity.ok(new PagedModel<>(transactions));
    }

    @GetMapping("/summary")
    public ResponseEntity<CashSummaryDTO> summary(
            @AuthenticationPrincipal User user,
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam @Min(1) @Max(9999) int year,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID accountId
    ) {
        return ResponseEntity.ok(service.getCashSummary(user, month, year, type, accountId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTransactionDTO data,
            @AuthenticationPrincipal User user
    ) {
        log.info("API: Requisição para ATUALIZAR transação {}. Usuário: {}", id, user.getEmail());
        var updatedTransaction = service.update(id, data, user);
        return ResponseEntity.ok(updatedTransaction);
    }

    @PostMapping("/{id}/settlements")
    public ResponseEntity<TransactionResponseDTO> settle(
            @PathVariable UUID id,
            @RequestBody @Valid SettleTransactionDTO data,
            @AuthenticationPrincipal User user
    ) {
        log.info("API: Requisição para BAIXAR transação {}. Usuário: {} | Valor: {}", id, user.getEmail(), data.amount());
        return ResponseEntity.ok(service.settle(id, data, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.warn("API: Requisição para EXCLUIR transação {}. Usuário: {}", id, user.getEmail());
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportToExcel(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @Min(1) @Max(12) Integer month,
            @RequestParam(required = false) @Min(1) @Max(9999) Integer year,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID accountId,
            HttpServletRequest request
    ) throws MissingServletRequestParameterException {
        if (month == null && request.getParameter("month") != null) {
            throw new MissingServletRequestParameterException("month", "Integer");
        }
        if (year == null && request.getParameter("year") != null) {
            throw new MissingServletRequestParameterException("year", "Integer");
        }
        if ((month == null) != (year == null)) {
            throw new MissingServletRequestParameterException(month == null ? "month" : "year", "Integer");
        }
        log.info("API: Exportando extrato em Excel. Usuário: {}", user.getEmail());
        byte[] excelData = service.exportToExcel(user, month, year, type, accountId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"extrato.xlsx\"")
                .body(excelData);
    }
}
