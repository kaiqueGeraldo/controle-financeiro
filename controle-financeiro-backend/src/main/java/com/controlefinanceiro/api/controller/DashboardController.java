package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.dashboard.dto.ChartPointDTO;
import com.controlefinanceiro.api.domain.dashboard.dto.DashboardFlowDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService service;

    @GetMapping("/flow")
    public ResponseEntity<DashboardFlowDTO> getMonthlyFlow(
            @AuthenticationPrincipal User user,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(service.getMonthlyFlow(user, month, year));
    }

    @GetMapping("/chart")
    public ResponseEntity<List<ChartPointDTO>> getWealthChart(
            @AuthenticationPrincipal User user,
            @RequestParam String period) {
        return ResponseEntity.ok(service.getWealthChart(period, user));
    }
}