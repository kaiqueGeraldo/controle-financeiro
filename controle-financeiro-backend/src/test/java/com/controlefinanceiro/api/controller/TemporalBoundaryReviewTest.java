package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.infra.exception.ResourceExceptionHandler;
import com.controlefinanceiro.api.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.bind.support.WebDataBinderFactory;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TemporalBoundaryReviewTest {
    private final User user = new User();
    private final AnnualSummaryService annual = mock(AnnualSummaryService.class);
    private final TransactionService transactions = mock(TransactionService.class);
    private final PlanningService planning = mock(PlanningService.class);
    private final DashboardService dashboard = mock(DashboardService.class);
    private final CreditCardService cards = mock(CreditCardService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        user.setId(UUID.fromString("30000000-0000-0000-0000-000000000001"));
        user.setEmail("review@example.invalid");
        AnnualSummaryController annualController = new AnnualSummaryController();
        ReflectionTestUtils.setField(annualController, "service", annual);
        // Before the fix the field does not exist: leave the real controller's
        // system-clock path intact so failure comes from its result, not setup.
        if (org.springframework.util.ReflectionUtils.findField(AnnualSummaryController.class, "clock") != null) {
            ReflectionTestUtils.setField(annualController, "clock", Clock.fixed(
                    Instant.parse("2040-01-01T02:59:59Z"), ZoneId.of("America/Sao_Paulo")));
        }
        TransactionController tx = new TransactionController();
        ReflectionTestUtils.setField(tx, "service", transactions);
        PlanningController plan = new PlanningController();
        ReflectionTestUtils.setField(plan, "service", planning);
        DashboardController dash = new DashboardController();
        ReflectionTestUtils.setField(dash, "service", dashboard);
        CreditCardController card = new CreditCardController();
        ReflectionTestUtils.setField(card, "service", cards);
        when(transactions.listAllFiltered(any(), any(), any(), any(), any(), any())).thenReturn(Page.empty());
        mvc = MockMvcBuilders.standaloneSetup(annualController, tx, plan, dash, card)
                .setControllerAdvice(new ResourceExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver(), new HandlerMethodArgumentResolver() {
                    public boolean supportsParameter(MethodParameter p) { return p.getParameterType() == User.class; }
                    public Object resolveArgument(MethodParameter p, ModelAndViewContainer m, NativeWebRequest r, WebDataBinderFactory b) { return user; }
                }).build();
    }

    @Test
    void r06DefaultYearUsesProductDayAtNewYear() throws Exception {
        mvc.perform(get("/annual-summary")).andExpect(status().isOk());
        verify(annual).getSummary(user, 2039);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/transactions?month=2", "/transactions?year=2026", "/transactions?month=&year=", "/annual-summary?year=", "/transactions?month=0&year=2026",
            "/transactions?month=13&year=2026", "/transactions?month=1&year=0",
            "/transactions?month=1&year=10000", "/transactions?month=1.5&year=2026",
            "/planning?month=13&year=2026", "/planning?month=1&year=0",
            "/dashboard/flow?month=0&year=2026", "/annual-summary?year=0",
            "/cards/30000000-0000-0000-0000-000000000002/invoice?month=13&year=2026"
    })
    void r07InvalidCompetenceStopsBeforeService(String url) throws Exception {
        mvc.perform(get(url)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields").isNotEmpty());
        verifyNoInteractions(transactions, planning, dashboard, annual, cards);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"month\":2}", "{\"month\":null,\"year\":2026}",
            "{\"month\":13,\"year\":2026}", "{\"month\":1.5,\"year\":2026}"})
    void r07CopyRejectsAbsentInvalidAndFractionalCompetence(String body) throws Exception {
        mvc.perform(post("/planning/copy-previous").contentType("application/json").content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields").isNotEmpty());
        verifyNoInteractions(planning);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "10000", "2026.5", "\"2026\""})
    void r07WrittenYearsAreStrictAndBounded(String year) throws Exception {
        mvc.perform(post("/annual-summary/note").contentType("application/json")
                .content("{\"year\":" + year + ",\"content\":\"Nota sintética\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.year").isNotEmpty());
        mvc.perform(patch("/planning/income").contentType("application/json")
                .content("{\"month\":2,\"year\":" + year + ",\"income\":10}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.year").isNotEmpty());
        verifyNoInteractions(annual, planning);
    }

    @Test
    void r07PaymentRejectsInvalidCompetenceBeforeBankOperation() throws Exception {
        mvc.perform(post("/cards/30000000-0000-0000-0000-000000000002/pay")
                .contentType("application/json").content("""
                        {"accountId":"30000000-0000-0000-0000-000000000003", "amount":10,
                         "date":"2026-09-09", "month":13, "year":0, "isPrepayment":false}
                        """))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.month").isNotEmpty())
                .andExpect(jsonPath("$.fields.year").isNotEmpty());
        verifyNoInteractions(cards);
    }

    @Test
    void r07UnknownPlanStatusIsInputError() throws Exception {
        mvc.perform(patch("/planning/30000000-0000-0000-0000-000000000002/status")
                .contentType("application/json").content("{\"status\":\"INVALID\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.status").isNotEmpty());
        verifyNoInteractions(planning);
    }

    @Test
    void validLeapMonthAndExplicitYearReachTheServicesUnchanged() throws Exception {
        mvc.perform(get("/transactions?month=2&year=2024")).andExpect(status().isOk());
        verify(transactions).listAllFiltered(eq(user), eq(2), eq(2024), isNull(), isNull(), any());
        mvc.perform(get("/annual-summary?year=2024")).andExpect(status().isOk());
        verify(annual).getSummary(user, 2024);
        mvc.perform(post("/planning/copy-previous").contentType("application/json")
                .content("{\"month\":2,\"year\":2024}")).andExpect(status().isOk());
        verify(planning).copyFromPreviousMonth(user, 2, 2024);
    }
}
