package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.onboarding.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.onboarding.OnboardingDraftService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;

@RestController
@RequestMapping("/onboarding")
public class OnboardingController {
    public record Data<T>(T data) {}
    private final OnboardingDraftService service;
    private final com.controlefinanceiro.api.service.onboarding.OnboardingApplicationService application;
    public OnboardingController(OnboardingDraftService service,com.controlefinanceiro.api.service.onboarding.OnboardingApplicationService application) {this.service=service;this.application=application;}
    @PostMapping(value="/prepare",consumes="application/json")
    public Data<?> prepare(@AuthenticationPrincipal User user,HttpServletRequest request) throws IOException {
        return new Data<>(application.prepare(user.getId(),OnboardingCommand.parse(request.getInputStream().readNBytes(4097),"prepare",null)));
    }
    @PostMapping(value="/complete",consumes="application/json")
    public Data<?> complete(@AuthenticationPrincipal User user,HttpServletRequest request) throws IOException {
        return new Data<>(application.complete(user.getId(),OnboardingCommand.parse(request.getInputStream().readNBytes(4097),"complete",null)));
    }
    @PostMapping(value="/intents/{operationId}/cancel",consumes="application/json")
    public Data<?> cancel(@AuthenticationPrincipal User user,@PathVariable String operationId,HttpServletRequest request) throws IOException {
        return new Data<>(application.cancel(user.getId(),OnboardingCommand.parse(request.getInputStream().readNBytes(4097),"cancel",operation(operationId))));
    }
    @GetMapping("/operations/{operationId}")
    public Data<?> recover(@AuthenticationPrincipal User user,@PathVariable String operationId) {
        return new Data<>(application.recover(user.getId(),operation(operationId)));
    }
    private static java.util.UUID operation(String id) {
        if(!id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))throw DraftProblem.invalid("/operationId","UUID_INVALID");
        return java.util.UUID.fromString(id);
    }
    @GetMapping
    public Data<OnboardingDraftService.SessionView> get(@AuthenticationPrincipal User user) {
        return new Data<>(service.get(user.getId()));
    }
    @PutMapping(value="/draft",consumes="application/json")
    public Data<OnboardingDraftService.SessionView> save(@AuthenticationPrincipal User user,HttpServletRequest request) throws IOException {
        // Bound allocation before parsing, including chunked requests and UTF-8 multibyte text.
        byte[] body=request.getInputStream().readNBytes(DraftValidator.MAX_BYTES+1);
        return new Data<>(service.save(user.getId(),DraftValidator.parse(body)));
    }
}
