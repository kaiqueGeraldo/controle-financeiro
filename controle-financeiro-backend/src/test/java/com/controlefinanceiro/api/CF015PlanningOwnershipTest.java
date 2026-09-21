package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import com.controlefinanceiro.api.domain.planning.MonthlyPlan;
import com.controlefinanceiro.api.domain.planning.MonthlyPlanRepository;
import com.controlefinanceiro.api.domain.planning.PlanItem;
import com.controlefinanceiro.api.domain.planning.PlanItemRepository;
import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

@AutoConfigureMockMvc
class CF015PlanningOwnershipTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate sql;
    @Autowired MonthlyPlanRepository plans;
    @Autowired PlanItemRepository items;

    @Test void createCannotLinkAnotherUsersCategory() throws Exception {
        User owner = user();
        Category privateCategory = new Category();
        privateCategory.setUser(user());
        privateCategory.setName("Categoria privada de B");
        privateCategory.setType(TransactionType.EXPENSE);
        privateCategory = categories.save(privateCategory);
        String description = "cf015-isolation-" + UUID.randomUUID();
        var response = mvc.perform(post("/planning")
                .header("Authorization", "Bearer " + tokens.generateToken(owner))
                .contentType("application/json")
                .content("""
                    {"description":"%s","amount":25,"dueDate":"2027-01-30","categoryId":"%s"}
                    """.formatted(description, privateCategory.getId())))
                .andReturn().getResponse();
        int persisted = sql.queryForObject("select count(*) from plan_items where description=?", Integer.class, description);
        assertAll("CF015-R06: isolamento deve valer também na criação",
                () -> assertThat(response.getStatus()).isEqualTo(404),
                () -> assertThat(persisted).isZero(),
                () -> assertThat(response.getContentAsString()).doesNotContain("Categoria privada de B"));
    }
    @Test void ownCategoryWorksAndMissingCategoryDoesNotCreateEvenAPlan() throws Exception {
        User owner = user();
        Category category = category(owner);
        var allowed = create(owner, category.getId(), "2027-03-20");
        assertThat(allowed.getStatus()).isEqualTo(200);
        assertThat(sql.queryForObject("select count(*) from plan_items where category_id=?", Integer.class, category.getId())).isEqualTo(1);
        var missing = create(owner, UUID.randomUUID(), "2027-04-20");
        assertThat(missing.getStatus()).isEqualTo(404);
        assertThat(sql.queryForObject("select count(*) from monthly_plans where user_id=? and month=4", Integer.class, owner.getId())).isZero();
    }

    @Test void editRejectsForeignAndMissingCategoryWithoutPartialChanges() throws Exception {
        User owner = user();
        Category own = category(owner);
        var created = create(owner, own.getId(), "2027-03-20");
        assertThat(created.getStatus()).isEqualTo(200);
        UUID id = sql.queryForObject("select id from plan_items where category_id=?", UUID.class, own.getId());
        for (UUID categoryId : new UUID[]{category(user()).getId(), UUID.randomUUID()}) {
            var response = mvc.perform(put("/planning/" + id)
                    .header("Authorization", "Bearer " + tokens.generateToken(owner))
                    .contentType("application/json")
                    .content("{\"description\":\"changed\",\"amount\":99,\"categoryId\":\"" + categoryId + "\"}"))
                    .andReturn().getResponse();
            assertThat(response.getStatus()).isEqualTo(404);
            assertThat(sql.queryForObject("select amount from plan_items where id=?", BigDecimal.class, id)).isEqualByComparingTo("25");
            assertThat(sql.queryForObject("select category_id from plan_items where id=?", UUID.class, id)).isEqualTo(own.getId());
        }
    }

    @Test void copyOwnCategoryPreservesLegitimateFlow() throws Exception {
        User owner = user();
        Category own = category(owner);
        assertThat(create(owner, own.getId(), "2027-03-20").getStatus()).isEqualTo(200);
        var response = mvc.perform(post("/planning/copy-previous")
                .header("Authorization", "Bearer " + tokens.generateToken(owner))
                .contentType("application/json").content("{\"month\":4,\"year\":2027}"))
                .andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(sql.queryForObject("""
                select count(*) from plan_items i join monthly_plans p on p.id=i.plan_id
                 where p.user_id=? and p.month=4 and p.year=2027 and i.category_id=?
                 and i.amount=25 and i.due_date=date '2027-04-20'
                """, Integer.class, owner.getId(), own.getId())).isEqualTo(1);
    }

    @Test void copyRejectsLegacyForeignCategoryBeforeCreatingTargetPlan() throws Exception {
        User owner = user();
        MonthlyPlan plan = new MonthlyPlan();
        plan.setUser(owner); plan.setMonth(3); plan.setYear(2027);
        plan = plans.save(plan);
        for (Category category : new Category[]{category(owner), category(user())}) {
            PlanItem item = new PlanItem();
            item.setPlan(plan); item.setCategory(category); item.setDescription("legacy synthetic");
            item.setAmount(new BigDecimal("25")); item.setDueDate(LocalDate.of(2027, 3, 20));
            item.setStatus(PlanItemStatus.PENDING); items.save(item);
        }
        var response = mvc.perform(post("/planning/copy-previous")
                .header("Authorization", "Bearer " + tokens.generateToken(owner))
                .contentType("application/json").content("{\"month\":4,\"year\":2027}"))
                .andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(404);
        assertThat(sql.queryForObject("select count(*) from monthly_plans where user_id=? and month=4", Integer.class, owner.getId())).isZero();
    }

    private org.springframework.mock.web.MockHttpServletResponse create(User owner, UUID categoryId, String date) throws Exception {
        return mvc.perform(post("/planning").header("Authorization", "Bearer " + tokens.generateToken(owner))
                .contentType("application/json").content("""
                    {"description":"synthetic","amount":25,"dueDate":"%s","categoryId":"%s"}
                    """.formatted(date, categoryId))).andReturn().getResponse();
    }
    private Category category(User owner) {
        Category value = new Category(); value.setUser(owner); value.setName("synthetic category");
        value.setType(TransactionType.EXPENSE); return categories.save(value);
    }
    private User user() {
        User value = new User();
        value.setNome("Pessoa sintética CF015");
        value.setEmail(UUID.randomUUID() + "@example.invalid");
        value.setSenha("synthetic-hash");
        return users.save(value);
    }
}
