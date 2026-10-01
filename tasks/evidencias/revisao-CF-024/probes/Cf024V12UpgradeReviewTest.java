package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.support.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import java.sql.DriverManager;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

/** Start from populated V12, then Spring applies V13 and Hibernate validates it. */
@ContextConfiguration(initializers=Cf024V12UpgradeReviewTest.Upgrade.class)
class Cf024V12UpgradeReviewTest extends PostgresIntegrationTest {
    @Autowired JdbcTemplate sql;
    @Autowired jakarta.persistence.EntityManagerFactory emf;
    @Test void populatedV12UpgradeHasValidMappingsAndPreservesPriorFactAndCommand() {
        assertThat(emf.isOpen()).isTrue();
        assertThat(sql.queryForList("select version from flyway_schema_history where success and type='SQL' order by installed_rank",String.class))
                .containsExactly("1","2","3","4","5","6","7","8","9","10","11","12","13");
        assertThat(sql.queryForList("select type from flyway_schema_history where version is null and success",String.class)).containsExactly("SCHEMA");
        assertThat(sql.queryForObject("select balance from accounts",java.math.BigDecimal.class)).isEqualByComparingTo("1000");
        assertThat(sql.queryForObject("select amount from transactions",java.math.BigDecimal.class)).isEqualByComparingTo("12.34");
        assertThat(sql.queryForObject("select count(*) from financial_commands",Integer.class)).isEqualTo(1);
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts",Integer.class)).isZero();
        assertThat(sql.queryForObject("select count(*) from pg_indexes where schemaname=current_schema() and tablename='financial_intent_receipts'",Integer.class)).isEqualTo(2);
    }
    public static class Upgrade implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        public void initialize(ConfigurableApplicationContext context) {
            new PostgresTestContainerInitializer().initialize(context);
            var env=context.getEnvironment();var schema="review_v12_"+UUID.randomUUID().toString().replace("-","");
            var url=env.getRequiredProperty("spring.datasource.url");var username=env.getRequiredProperty("spring.datasource.username");var password=env.getRequiredProperty("spring.datasource.password");
            Flyway.configure().dataSource(url,username,password).schemas(schema).defaultSchema(schema).target("12").load().migrate();
            try(var connection=DriverManager.getConnection(url,username,password);var statement=connection.createStatement()) {
                statement.execute("set search_path to "+schema);
                statement.execute("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values ('10000000-0000-0000-0000-000000000001','Review','review@example.invalid','synthetic',true,false)");
                statement.execute("insert into accounts(id,name,type,balance,is_archived,user_id,version) values ('20000000-0000-0000-0000-000000000001','Review','CHECKING',1000,false,'10000000-0000-0000-0000-000000000001',0)");
                statement.execute("insert into transactions(id,description,amount,date,is_paid,type,account_id,user_id,is_system_managed,status,origin,created_at) values ('40000000-0000-0000-0000-000000000001','prior fact',12.34,'2026-09-07',true,'INCOME','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',false,'SETTLED','USER','2026-09-07 10:00:00')");
                statement.execute("insert into financial_commands(id,user_id,original_id,kind,fingerprint,transaction_id,recorded_at) values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','SETTLE','"+"a".repeat(64)+"','40000000-0000-0000-0000-000000000001',now())");
            } catch(Exception failure) {throw new IllegalStateException(failure);}
            TestPropertyValues.of("spring.flyway.enabled=true","spring.flyway.schemas="+schema,"spring.flyway.default-schema="+schema,
                    "spring.datasource.hikari.schema="+schema,"spring.jpa.hibernate.ddl-auto=validate","spring.jpa.properties.hibernate.default_schema="+schema).applyTo(env);
        }
    }
}
