package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import java.util.UUID;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Import(DirectedGoalHistoryTemporalTest.FixedClock.class)
class DirectedGoalHistoryTemporalTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate sql;

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClock {
        @Bean @Primary Clock directedProductClock() {
            return Clock.fixed(Instant.parse("2026-09-08T03:10:00Z"), ZoneId.of("America/Sao_Paulo"));
        }
    }

    @Test void newGoalHistoryReturnsTheRecordedInstantAfterCommitAndReload() throws Exception {
        User owner = new User();
        owner.setNome("Revisão temporal");
        owner.setEmail(UUID.randomUUID() + "@example.test");
        owner.setSenha("synthetic-hash");
        owner = users.save(owner);
        String auth = "Bearer " + tokens.generateToken(owner);
        String created = mvc.perform(post("/goals").header("Authorization", auth)
                .contentType("application/json").content("""
                {"title":"Meta temporal","targetValue":10,"deadline":"2027-01-01","type":"NUMERIC"}
                """)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(created, "$.id");
        mvc.perform(post("/goals/" + id + "/deposit").header("Authorization", auth)
                .contentType("application/json").content("{\"amount\":1,\"time\":\"08:15\"}"))
                .andExpect(status().isOk());
        // Separate HTTP transaction after commit, then independent SQL against disposable PostgreSQL.
        String body = mvc.perform(get("/goals/" + id + "/history").header("Authorization", auth))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(sql.queryForObject("select count(*) from goal_history where goal_id=?", Integer.class,
                UUID.fromString(id))).isEqualTo(1);
        System.out.println("RD58-02 SQL date=" + sql.queryForObject(
                "select date::text from goal_history where goal_id=?", String.class, UUID.fromString(id)));
        String recorded = JsonPath.read(body, "$[0].date");
        // Literal E11 oracle; user-entered wall time must not replace the server recording instant.
        assertThat(recorded).isEqualTo("2026-09-08T03:10:00Z");
    }
}
