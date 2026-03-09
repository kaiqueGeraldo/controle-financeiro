package com.controlefinanceiro.api.domain.habit;

public enum HabitStatus {
    PENDING,   // Ainda não preenchido hoje
    COMPLETED, // Feito
    SKIPPED,   // Pulado (Perdão automático se ontem foi COMPLETED)
    FAILED     // Falhou (Zera a ofensiva)
}