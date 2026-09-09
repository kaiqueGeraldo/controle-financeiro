package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.infra.exception.ResourceExceptionHandler;
import com.controlefinanceiro.api.service.TransactionService;
import jakarta.validation.Valid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HttpContractControllerTest {

    private TransactionService transactionService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        transactionService = mock(TransactionService.class);
        TransactionController transactionController = new TransactionController();
        ReflectionTestUtils.setField(transactionController, "service", transactionService);

        mvc = MockMvcBuilders
                .standaloneSetup(transactionController, new ContractProbeController())
                .setControllerAdvice(new ResourceExceptionHandler())
                .build();
    }

    @Test
    void acUi005BeanValidationReturns400WithEveryInvalidField() throws Exception {
        mvc.perform(post("/transactions")
                        .contentType("application/json")
                        .content("""
                                {
                                  "description": "",
                                  "amount": 0,
                                  "date": null,
                                  "type": null,
                                  "accountId": null,
                                  "isPaid": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fields.description[0]").value("A descrição é obrigatória"))
                .andExpect(jsonPath("$.fields.amount[0]").value("O valor deve ser positivo"))
                .andExpect(jsonPath("$.fields.date[0]").value("A data é obrigatória"))
                .andExpect(jsonPath("$.fields.type[0]").value("O tipo de transação é obrigatório"))
                .andExpect(jsonPath("$.fields.accountId[0]").value("A conta é obrigatória"));

        verifyNoInteractions(transactionService);
    }

    @Test
    void acTime002MalformedCivilDateReturns400IdentifyingDate() throws Exception {
        mvc.perform(post("/transactions")
                        .contentType("application/json")
                        .content("""
                                {
                                  "description": "Receita sintética",
                                  "amount": 10.00,
                                  "date": "2026-02-31",
                                  "time": "09:30",
                                  "type": "INCOME",
                                  "accountId": "10000000-0000-0000-0000-000000000001",
                                  "isPaid": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fields.date[0]").isNotEmpty());

        verifyNoInteractions(transactionService);
    }

    @Test
    void acTime002InvalidWallTimeOnUpdateReturns400IdentifyingTime() throws Exception {
        mvc.perform(put("/transactions/10000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("""
                                {
                                  "time": "24:00"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fields.time[0]").isNotEmpty());

        verifyNoInteractions(transactionService);
    }

    @Test
    void acUi004AuthorizationIs403AndAuthenticationIs401() throws Exception {
        mvc.perform(get("/contract/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Operação não permitida."));

        mvc.perform(get("/contract/unauthenticated"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void acUi005OptimisticConflictIs409AndServerFailureRemains500() throws Exception {
        mvc.perform(get("/contract/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        mvc.perform(get("/contract/failure"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Ocorreu um erro inesperado no sistema. Contate o suporte."));
    }

    @Test
    void paginationAnd204HaveStableShapes() throws Exception {
        mvc.perform(get("/contract/page"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("tx-1"))
                .andExpect(jsonPath("$.page.size").value(30))
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.page.totalPages").value(1));

        mvc.perform(post("/contract/no-content"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
    }

    @RestController
    @RequestMapping("/contract")
    static class ContractProbeController {

        @GetMapping("/forbidden")
        void forbidden() {
            throw new AccessDeniedException("detalhe interno não deve vazar");
        }

        @GetMapping("/unauthenticated")
        void unauthenticated() {
            throw new org.springframework.security.authentication.InsufficientAuthenticationException("token ausente");
        }

        @GetMapping("/conflict")
        void conflict() {
            throw new ObjectOptimisticLockingFailureException("Transaction", "tx-1");
        }

        @GetMapping("/failure")
        void failure() {
            throw new IllegalStateException("segredo sintético");
        }

        @GetMapping("/page")
        PagedModel<Map<String, String>> page() {
            return new PagedModel<>(new PageImpl<>(
                    List.of(Map.of("id", "tx-1")),
                    PageRequest.of(0, 30),
                    1
            ));
        }

        @PostMapping("/no-content")
        org.springframework.http.ResponseEntity<Void> noContent() {
            return org.springframework.http.ResponseEntity.noContent().build();
        }

        @PostMapping("/validated")
        void validated(@RequestBody @Valid CreateTransactionDTO ignored) {
        }
    }
}
