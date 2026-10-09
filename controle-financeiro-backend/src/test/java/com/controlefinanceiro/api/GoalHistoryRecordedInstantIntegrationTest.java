package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.habit.HabitFrequency;
import com.controlefinanceiro.api.domain.habit.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ContextConfiguration;
import com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@ContextConfiguration(initializers = EmptyMigrationTestInitializer.class, inheritInitializers = false)
@Import(GoalHistoryRecordedInstantIntegrationTest.FixedClock.class)
class GoalHistoryRecordedInstantIntegrationTest extends PostgresIntegrationTest {
    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClock {
        @Bean @Primary Clock historyClock() {
            return Clock.fixed(Instant.parse("2026-09-08T03:10:00.123456789Z"), ZoneId.of("America/Sao_Paulo"));
        }
    }
    @Autowired GoalService goals;
    @Autowired HabitService habits;
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired GoalAllocationRepository allocations;
    @Autowired JdbcTemplate sql;
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @Autowired GoalHistoryRepository histories;

    @org.junit.jupiter.api.Test
    void independentOrmUpdatePreservesOriginalAuditInstant() {
        User owner = new User(); owner.setNome("Review"); owner.setEmail(UUID.randomUUID()+"@example.test"); owner.setSenha("synthetic");
        users.save(owner);
        UUID id = goal(owner, GoalType.NUMERIC);
        goals.addValue(id, new GoalDepositDTO(null, BigDecimal.ONE, "08:15", "before", null), owner);
        GoalHistory original = histories.findByGoalIdOrderByDateDesc(id).getFirst();
        original.setNote("updated");
        original.setRecordedAt(Instant.parse("2030-01-01T00:00:00Z"));
        histories.saveAndFlush(original);
        GoalHistory reloaded = histories.findById(original.getId()).orElseThrow();
        assertThat(reloaded.getNote()).isEqualTo("updated");
        assertThat(reloaded.getRecordedAt()).isEqualTo(Instant.parse("2026-09-08T03:10:00.123456Z"));
        assertThat(sql.queryForObject("select is_nullable from information_schema.columns where table_schema=current_schema() and table_name='goal_history' and column_name='recorded_at'", String.class)).isEqualTo("YES");
    }

    @ParameterizedTest
    @ValueSource(strings = {"UTC", "America/Sao_Paulo", "Pacific/Kiritimati"})
    void everyWriterCommitsTheSameInstantAndLegacyRemainsUnknownAfterReload(String zone) throws Exception {
        TimeZone previous = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone(zone));
            verifyWritersAndReload();
        } finally { TimeZone.setDefault(previous); }
    }

    private void verifyWritersAndReload() throws Exception {
        User owner = new User(); owner.setNome("RD58"); owner.setEmail(UUID.randomUUID()+"@example.test"); owner.setSenha("synthetic");
        users.save(owner);
        UUID numeric = goal(owner, GoalType.NUMERIC);
        UUID monetary = goal(owner, GoalType.MONETARY);
        Account first = account(owner); Account second = account(owner);
        goals.addValue(numeric, new GoalDepositDTO(null, BigDecimal.ONE, "08:15", "numeric", null), owner);
        goals.addValue(monetary, new GoalDepositDTO(first.getId(), new BigDecimal("10"), "08:15", "monetary", null), owner);
        goals.setAllocation(monetary, new SetGoalAllocationDTO(first.getId(), null, new BigDecimal("20")), owner);
        UUID allocation = allocations.findByGoalIdAndAccountId(monetary, first.getId()).orElseThrow().getId();
        goals.moveAllocation(monetary, new MoveGoalAllocationDTO(allocation, second.getId(), null, new BigDecimal("5")), owner);
        UUID habit = habits.create(new CreateHabitDTO("RD58 hábito", null, "x", "blue", HabitFrequency.DAILY, null, numeric), owner).id();
        habits.toggleHabit(habit, new ToggleHabitDTO(LocalDate.of(2026,9,7)), owner);
        var rows = sql.queryForList("select recorded_at, date::text as raw from goal_history where goal_id in (?,?)", numeric, monetary);
        assertThat(rows).hasSize(5);
        for (var row : rows) {
            assertThat(((java.sql.Timestamp) row.get("recorded_at")).toInstant()).isEqualTo(Instant.parse("2026-09-08T03:10:00.123456Z"));
            assertThat(row.get("raw")).isEqualTo("2026-09-08 00:10:00.123456");
        }
        assertThat(accounts.findById(first.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000");
        assertThat(accounts.findById(second.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000");
        for (UUID id : List.of(numeric, monetary)) {
            String initial = history(id, owner);
            List<String> dates = JsonPath.read(initial, "$[*].date");
            assertThat(dates).allMatch("2026-09-08T03:10:00.123456Z"::equals);
            List<String> instants = JsonPath.read(initial, "$[*].recordedAt");
            assertThat(instants).allMatch("2026-09-08T03:10:00.123456Z"::equals);
            List<String> origins = JsonPath.read(initial, "$[*].dateOrigin");
            assertThat(origins).allMatch("SERVER_CLOCK"::equals);
            assertThat(history(id, owner)).isEqualTo(initial);
        }
        UUID legacy = UUID.randomUUID(); UUID absent = UUID.randomUUID();
        // Historical SQL fixture, independent of the current entity and writer.
        sql.update("insert into goal_history(id,goal_id,amount,note,date) values (?,?,1,'legacy',timestamp '2026-09-07 23:30:00.123456')", legacy,numeric);
        sql.update("insert into goal_history(id,goal_id,amount,note,date) values (?,?,1,'absent',null)", absent,numeric);
        String body = history(numeric, owner);
        List<Map<String,Object>> records = JsonPath.read(body,"$");
        var old = records.stream().filter(r -> legacy.toString().equals(r.get("id"))).findFirst().orElseThrow();
        assertThat(old.get("date")).isEqualTo("2026-09-07T23:30:00.123456");
        assertThat(old.get("legacyDateRaw")).isEqualTo(old.get("date"));
        assertThat(old.get("recordedAt")).isNull(); assertThat(old.get("dateOrigin")).isEqualTo("UNKNOWN");
        var missing = records.stream().filter(r -> absent.toString().equals(r.get("id"))).findFirst().orElseThrow();
        assertThat(missing.get("date")).isNull(); assertThat(missing.get("dateOrigin")).isEqualTo("UNKNOWN");
        assertThat(history(numeric, owner)).isEqualTo(body);
        assertThat(sql.queryForObject("select date::text from goal_history where id=?",String.class,legacy)).isEqualTo("2026-09-07 23:30:00.123456");
        assertThatThrownBy(() -> goals.addValue(monetary,new GoalDepositDTO(first.getId(),new BigDecimal("2000"),null,null,null),owner));
        assertThat(sql.queryForObject("select count(*) from goal_history where goal_id=?",Integer.class,monetary)).isEqualTo(3);
        String reject = "rd58_reject_" + UUID.randomUUID().toString().replace("-", "");
        sql.execute("create function " + reject + "() returns trigger language plpgsql as $$ begin if new.goal_id='"
                + monetary + "'::uuid then raise exception 'RD58 history failure'; end if; return new; end $$");
        sql.execute("create trigger " + reject + " before insert on goal_history for each row execute function " + reject + "()");
        try {
            assertThatThrownBy(() -> goals.setAllocation(monetary, new SetGoalAllocationDTO(first.getId(), null, new BigDecimal("30")), owner))
                    .hasMessageContaining("RD58 history failure");
            assertThat(sql.queryForObject("select current_value from goals where id=?", BigDecimal.class, monetary)).isEqualByComparingTo("20");
            assertThat(sql.queryForObject("select amount from goal_allocations where id=?", BigDecimal.class, allocation)).isEqualByComparingTo("15");
            assertThat(sql.queryForObject("select count(*) from goal_history where goal_id=?",Integer.class,monetary)).isEqualTo(3);
        } finally {
            sql.execute("drop trigger " + reject + " on goal_history");
            sql.execute("drop function " + reject + "()");
        }
        System.out.println("RD58: five writers SQL/HTTP/reload = 2026-09-08T03:10:00.123456Z; legacy raw/null preserved; rejected allocation adds no history.");
    }
    private String history(UUID id, User owner) throws Exception {
        return mvc.perform(get("/goals/"+id+"/history").header("Authorization","Bearer "+tokens.generateToken(owner)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }
    private UUID goal(User owner, GoalType type) {
        return goals.create(new CreateGoalDTO("RD58",new BigDecimal("100"),LocalDate.of(2027,1,1),null,null,null,type,false),owner).id();
    }
    private Account account(User owner) {
        Account a = new Account(); a.setName("RD58"); a.setType(AccountType.CHECKING); a.setUser(owner); a.setBalance(new BigDecimal("1000"));
        return accounts.save(a);
    }
}
