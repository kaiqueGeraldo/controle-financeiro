package com.controlefinanceiro.api.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordDTO(
        @NotBlank String senhaAtual,
        @NotBlank @Size(min = 6, message = "A nova senha deve ter no mínimo 6 caracteres") String novaSenha
) {
}