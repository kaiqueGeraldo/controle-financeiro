package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.summary.dto.AnnualSummaryDTO;
import com.controlefinanceiro.api.domain.summary.dto.UpdateNoteDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.AnnualSummaryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.Clock;
import java.time.LocalDate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/annual-summary")
public class AnnualSummaryController {

    @Autowired
    private AnnualSummaryService service;
    @Autowired
    private Clock clock;

    @GetMapping
    public ResponseEntity<AnnualSummaryDTO> getSummary(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @Min(1) @Max(9999) Integer year,
            HttpServletRequest request) throws MissingServletRequestParameterException {
        if (year == null && request.getParameter("year") != null) {
            throw new MissingServletRequestParameterException("year", "Integer");
        }

        // Se não mandar ano, pega o atual
        int targetYear = (year != null) ? year : LocalDate.now(clock).getYear();

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
