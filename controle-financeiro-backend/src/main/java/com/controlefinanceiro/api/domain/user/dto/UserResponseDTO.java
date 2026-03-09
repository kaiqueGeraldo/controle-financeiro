package com.controlefinanceiro.api.domain.user.dto;

import java.util.UUID;

public record UserResponseDTO(
        UUID id,
        String nome,
        String email,
        boolean privacyMode,
        boolean darkMode,
        boolean notifContas,
        boolean notifSemanal,
        String dashboardConfig
) {}