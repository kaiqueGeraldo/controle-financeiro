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
    public OnboardingController(OnboardingDraftService service) {this.service=service;}
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
