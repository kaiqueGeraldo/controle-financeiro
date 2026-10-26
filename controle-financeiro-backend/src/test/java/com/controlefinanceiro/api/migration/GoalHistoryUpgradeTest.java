package com.controlefinanceiro.api.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import java.sql.*;
import static org.assertj.core.api.Assertions.assertThat;

class GoalHistoryUpgradeTest {
    @Test void v13UpgradePreservesIndependentLegacyValuesAndHasNoBackfill() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("rd58");
        Flyway.configure().dataSource(Cf017PostgresSupport.jdbcUrl(), Cf017PostgresSupport.username(), Cf017PostgresSupport.password())
                .schemas(schema).defaultSchema(schema).locations("classpath:db/migration").target("13").cleanDisabled(true).load().migrate();
        try (Connection c = Cf017PostgresSupport.connect(); Statement s = c.createStatement()) {
            s.execute("set search_path to " + schema);
            s.execute("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values ('10000000-0000-0000-0000-000000000001','RD58','rd58@example.test','synthetic',false,false)");
            s.execute("insert into goals(id,user_id,title,type,target_value,current_value,deadline) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','RD58','NUMERIC',10,2,date '2027-01-01')");
            s.execute("insert into goal_history(id,goal_id,amount,note,date) values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,'raw',timestamp '2026-09-07 23:30:00.123456'),('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',1,'null',null)");
            String before = snapshot(s);
            assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isEqualTo(3);
            assertThat(snapshot(s)).isEqualTo(before);
            try (var rows = s.executeQuery("select count(*) from goal_history where recorded_at is null")) { rows.next(); assertThat(rows.getInt(1)).isEqualTo(2); }
            try (var rows = s.executeQuery("select data_type,datetime_precision,column_default from information_schema.columns where table_schema='"+schema+"' and table_name='goal_history' and column_name='recorded_at'")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getString(1)).isEqualTo("timestamp with time zone"); assertThat(rows.getInt(2)).isEqualTo(6); assertThat(rows.getString(3)).isNull();
            }
            assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isZero();
            System.out.println("RD58 V13->V16: preserved PK, goal, amount, note, raw date/null; recorded_at null for both legacy rows; migration idempotent.");
        }
    }
    private String snapshot(Statement s) throws SQLException {
        try (var rows = s.executeQuery("select string_agg(concat_ws('|',id,goal_id,amount,note,coalesce(date::text,'NULL')),';' order by id) from goal_history")) {
            rows.next(); return rows.getString(1);
        }
    }
}
