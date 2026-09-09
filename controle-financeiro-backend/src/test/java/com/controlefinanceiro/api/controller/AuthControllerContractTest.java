package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.auth.dto.LoginRequestDTO;
import com.controlefinanceiro.api.domain.auth.dto.RegisterRequestDTO;
import com.controlefinanceiro.api.infra.exception.ResourceExceptionHandler;
import com.controlefinanceiro.api.service.AuthService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerContractTest {

    private AuthService authService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        AuthController controller = new AuthController();
        ReflectionTestUtils.setField(controller, "authService", authService);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ResourceExceptionHandler())
                .build();
    }

    @Test
    void invalidLoginIs401ButUnexpectedFailureRemains500() throws Exception {
        when(authService.login(any(LoginRequestDTO.class)))
                .thenThrow(new BusinessRuleException("E-mail ou senha inválidos"))
                .thenThrow(new IllegalStateException("falha sintética"));

        String validLogin = """
                {"email":"pessoa@example.invalid","senha":"segredo-sintetico"}
                """;

        mvc.perform(post("/auth/login").contentType("application/json").content(validLogin))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Autenticação necessária para acessar este recurso."));

        mvc.perform(post("/auth/login").contentType("application/json").content(validLogin))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500));
    }

    @Test
    void invalidLoginBodyIs400WithFieldsWithoutCallingService() throws Exception {
        mvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"invalido\",\"senha\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email[0]").value("Formato de e-mail inválido"))
                .andExpect(jsonPath("$.fields.senha[0]").value("A senha é obrigatória"));

        verifyNoInteractions(authService);
    }

    @Test
    void expectedRegistrationConflictIs400WithJsonBody() throws Exception {
        doThrow(new BusinessRuleException("E-mail já cadastrado"))
                .when(authService).register(any(RegisterRequestDTO.class));

        mvc.perform(post("/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "nome":"Pessoa Sintética",
                                  "email":"pessoa@example.invalid",
                                  "senha":"segredo-sintetico"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));
    }
}
