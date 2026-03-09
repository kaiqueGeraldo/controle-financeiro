package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.summary.dto.AnnualSummaryDTO;
import com.controlefinanceiro.api.domain.summary.dto.UpdateNoteDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.AnnualSummaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/annual-summary")
public class AnnualSummaryController {

    @Autowired
    private AnnualSummaryService service;

    @GetMapping
    public ResponseEntity<AnnualSummaryDTO> getSummary(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer year) {

        // Se não mandar ano, pega o atual
        int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();

        return ResponseEntity.ok(service.getSummary(user, targetYear));
    }

    @PostMapping("/note")
    public ResponseEntity<Void> updateNote(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateNoteDTO data) {
        service.updateNote(user, data);
        return ResponseEntity.ok().build();
    }
}