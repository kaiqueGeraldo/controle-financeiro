package com.controlefinanceiro.api.domain.user.dto;

public record UpdatePreferencesDTO(
        Boolean darkMode,
        Boolean privacyMode,
        Boolean notifContas,
        Boolean notifSemanal,
        String dashboardConfig
) {
}