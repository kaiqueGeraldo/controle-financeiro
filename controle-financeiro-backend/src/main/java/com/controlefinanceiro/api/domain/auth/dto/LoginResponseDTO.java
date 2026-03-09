package com.controlefinanceiro.api.domain.auth.dto;

public record LoginResponseDTO(String token, String nome, String email) {}