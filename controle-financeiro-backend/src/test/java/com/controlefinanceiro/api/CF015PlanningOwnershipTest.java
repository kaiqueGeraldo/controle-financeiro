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

@AutoConfigureMockMvc
class CF015PlanningOwnershipTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate sql;

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
    private User user() {
        User value = new User();
        value.setNome("Pessoa sintética CF015");
        value.setEmail(UUID.randomUUID() + "@example.invalid");
        value.setSenha("synthetic-hash");
        return users.save(value);
    }
}
