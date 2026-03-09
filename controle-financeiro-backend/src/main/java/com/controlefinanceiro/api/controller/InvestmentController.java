package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.investment.InvestTransaction;
import com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentResponseDTO;
import com.controlefinanceiro.api.domain.investment.dto.UpdateBalanceDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.InvestmentService;
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
@RequestMapping("/investments")
public class InvestmentController {

    @Autowired
    private InvestmentService service;

    @GetMapping
    public ResponseEntity<List<InvestmentResponseDTO>> listAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listAll(user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<InvestTransaction>> getHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getHistory(id, user));
    }

    @PostMapping
    public ResponseEntity<InvestmentResponseDTO> create(
            @RequestBody @Valid CreateInvestmentDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Novo Ativo '{}' ({}) para usuário {}", data.ticker(), data.type(), user.getEmail());
        return ResponseEntity.ok(service.create(data, user));
    }

    @PostMapping("/operation")
    public ResponseEntity<Void> performOperation(
            @RequestBody @Valid InvestmentOperationDTO data,
            @AuthenticationPrincipal User user) {

        log.info("API: Operação de {} no ativo ID {}. Qtd: {}, Preço: {}",
                data.type(), data.investmentId(), data.quantity(), data.price());

        service.performOperation(data, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update-balance")
    public ResponseEntity<Void> updateBalance(
            @RequestBody @Valid UpdateBalanceDTO data,
            @AuthenticationPrincipal User user) {

        log.info("API: Atualização manual de saldo para ativo ID {}", data.investmentId());
        service.updateBalance(data, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.deleteInvestment(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/operation/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID transactionId, @AuthenticationPrincipal User user) {
        service.deleteTransaction(transactionId, user);
        return ResponseEntity.noContent().build();
    }
}