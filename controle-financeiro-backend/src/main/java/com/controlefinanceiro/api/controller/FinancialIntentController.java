package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.intent.FinancialIntentReceiptDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.intent.FinancialIntents;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/financial-intents")
@RequiredArgsConstructor
public class FinancialIntentController {
    private final FinancialIntents intents;
    @GetMapping("/{operationId}")
    public FinancialIntentReceiptDTO recover(@PathVariable UUID operationId, @AuthenticationPrincipal User user) {
        return intents.recover(operationId,user.getId());
    }
}
