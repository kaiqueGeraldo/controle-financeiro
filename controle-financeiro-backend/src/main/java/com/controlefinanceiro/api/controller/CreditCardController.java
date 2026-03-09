package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.card.CardTransaction;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.CreditCardService;
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
@RequestMapping("/cards")
public class CreditCardController {

    @Autowired
    private CreditCardService service;

    @GetMapping
    public ResponseEntity<List<CardSummaryDTO>> listAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listAllWithSummary(user));
    }

    @PostMapping
    public ResponseEntity<CreditCardResponseDTO> create(@RequestBody @Valid CreateCardDTO data, @AuthenticationPrincipal User user) {
        log.info("API: Criar Cartão '{}'. Usuário: {}", data.name(), user.getEmail());
        return ResponseEntity.ok(service.createCard(data, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        log.warn("API: Excluir Cartão {}. Usuário: {}", id, user.getEmail());
        service.deleteCard(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transaction")
    public ResponseEntity<Void> createTransaction(@RequestBody @Valid CreateCardTransactionDTO data) {
        log.info("API: Nova Compra no Cartão {}. Valor: {}. Parcelas: {}", data.cardId(), data.amount(), data.totalInstallments());
        service.createTransaction(data);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CreditCardResponseDTO> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCardDTO data,
            @AuthenticationPrincipal User user) {
        log.info("API: Atualizar Cartão {}", id);
        return ResponseEntity.ok(service.update(id, data, user));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<InvoiceDetailsDTO> getInvoice(
            @PathVariable UUID id,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal User user) {
        log.debug("API: Ler Fatura Cartão {} - {}/{}", id, month, year);
        return ResponseEntity.ok(service.getInvoiceDetails(id, month, year, user));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Void> payInvoice(
            @PathVariable UUID id,
            @RequestBody @Valid PayInvoiceDTO data,
            @AuthenticationPrincipal User user) {

        log.info("API: PAGAMENTO FATURA Cartão {}. Valor: {}. É adiantamento? {}", id, data.amount(), data.isPrepayment());
        service.payInvoice(id, data, user);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/transaction/{id}")
    public ResponseEntity<CardTransaction> updateTransaction(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCardTransactionDTO data,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.updateTransaction(id, data, user));
    }

    @DeleteMapping("/transaction/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.deleteTransaction(id, user);
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