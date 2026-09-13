package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.domain.planning.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class PlanningEditIntegrationTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired MonthlyPlanRepository plans;
    @Autowired PlanItemRepository items;
    @Autowired CategoryRepository categories;
    @Autowired CreditCardRepository cards;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate sql;
    User owner;
    PlanItem item;
    String authorization;

    @BeforeEach void setup() {
        owner = user();
        authorization = "Bearer " + tokens.generateToken(owner);
        MonthlyPlan plan = new MonthlyPlan();
        plan.setUser(owner); plan.setMonth(1); plan.setYear(2027);
        plan = plans.save(plan);
        item = new PlanItem();
        item.setPlan(plan); item.setDescription("Original sintético");
        item.setAmount(new BigDecimal("25.00")); item.setDueDate(LocalDate.of(2027, 1, 30));
        item.setStatus(PlanItemStatus.SAVED); item.setOrderIndex(7);
        item = items.save(item);
    }

    @Test void editPersistsAndReloadKeepsStatusOrderAndCompetence() throws Exception {
        edit(item.getId(), """
                {"description":"Editado sintético","amount":35.50,"dueDate":"2027-01-29"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2027-01-29"));
        mvc.perform(get("/planning?month=1&year=2027").header("Authorization", authorization))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].description").value("Editado sintético"))
                .andExpect(jsonPath("$.items[0].amount").value(35.50))
                .andExpect(jsonPath("$.items[0].dueDate").value("2027-01-29"))
                .andExpect(jsonPath("$.items[0].status").value("SAVED"));
        assertThat(sql.queryForMap("select status, order_index, plan_id from plan_items where id=?", item.getId()))
                .containsEntry("status", "SAVED").containsEntry("order_index", 7)
                .containsEntry("plan_id", item.getPlan().getId());
    }

    @Test void omittedFieldsPreserveAndCategoryNullClears() throws Exception {
        Category category = category(owner);
        edit(item.getId(), "{\"categoryId\":\"" + category.getId() + "\"}").andExpect(status().isOk());
        edit(item.getId(), "{}").andExpect(status().isOk()).andExpect(jsonPath("$.categoryId").value(category.getId().toString()));
        edit(item.getId(), "{\"categoryId\":null}").andExpect(status().isOk()).andExpect(jsonPath("$.categoryId").isEmpty());
        assertOriginal();
    }

    @Test void invalidAndNonEditableFieldsNeverPartiallyWrite() throws Exception {
        for (String bad : new String[]{"\"description\":null", "\"description\":\"  \"", "\"amount\":null", "\"amount\":0",
                "\"dueDate\":null", "\"dueDate\":\"2027-02-31\"", "\"dueDate\":\"0000-01-01\"",
                "\"dueDate\":\"2027-02-01\"", "\"status\":\"PAID\"", "\"cardId\":null",
                "\"planId\":null", "\"orderIndex\":2", "\"isSystemManaged\":false", "\"categoryId\":\"\""}) {
            edit(item.getId(), "{\"description\":\"Não persistir\"," + bad + "}")
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields").isNotEmpty());
            assertOriginal();
        }
    }

    @Test void inaccessibleItemsAndReferencesDoNotWrite() throws Exception {
        edit(UUID.randomUUID(), "{\"description\":\"Não persistir\"}").andExpect(status().isNotFound());
        String otherToken = "Bearer " + tokens.generateToken(user());
        mvc.perform(put("/planning/" + item.getId()).header("Authorization", otherToken)
                .contentType("application/json").content("{\"description\":\"Não persistir\"}"))
                .andExpect(status().isNotFound());
        for (UUID categoryId : new UUID[]{UUID.randomUUID(), category(user()).getId()}) {
            edit(item.getId(), "{\"description\":\"Não persistir\",\"categoryId\":\"" + categoryId + "\"}")
                    .andExpect(status().isNotFound());
            assertOriginal();
        }
    }

    @Test void invoiceManagedItemCannotBeEdited() throws Exception {
        CreditCard card = new CreditCard();
        card.setUser(owner); card.setName("Cartão sintético"); card.setLimit(new BigDecimal("1000"));
        card.setClosingDay(5); card.setDueDay(10); card = cards.save(card);
        sql.update("update plan_items set card_id=? where id=?", card.getId(), item.getId());
        edit(item.getId(), "{\"description\":\"Não persistir\"}").andExpect(status().isBadRequest());
        assertOriginal();
    }

    private ResultActions edit(UUID id, String body) throws Exception {
        return mvc.perform(put("/planning/" + id).header("Authorization", authorization)
                .contentType("application/json").content(body));
    }
    private void assertOriginal() {
        assertThat(sql.queryForMap("select description, amount, due_date from plan_items where id=?", item.getId()))
                .containsEntry("description", "Original sintético").containsEntry("amount", new BigDecimal("25.00"))
                .containsEntry("due_date", java.sql.Date.valueOf("2027-01-30"));
    }
    private User user() {
        User user = new User(); user.setNome("Usuário sintético");
        user.setEmail(UUID.randomUUID() + "@example.test"); user.setSenha("synthetic-hash");
        return users.save(user);
    }
    private Category category(User user) {
        Category category = new Category(); category.setUser(user); category.setName("Categoria sintética");
        category.setType(TransactionType.EXPENSE); return categories.save(category);
    }
}
