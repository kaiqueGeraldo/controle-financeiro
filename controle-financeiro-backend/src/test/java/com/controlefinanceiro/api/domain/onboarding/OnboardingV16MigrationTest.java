package com.controlefinanceiro.api.domain.onboarding;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class OnboardingV16MigrationTest extends OnboardingApplicationSupport {
    @Autowired DataSource dataSource;
    @Test void upgradeV15PreservesLegacyAndAddsApplicationConstraintsWithoutGuessingDefault() throws Exception {
        String schema="cf030_upgrade_"+UUID.randomUUID().toString().replace("-","");UUID owner=UUID.randomUUID(),other=UUID.randomUUID(),account=UUID.randomUUID(),session=UUID.randomUUID();
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("15").load().migrate();
        try(var connection=dataSource.getConnection();var s=connection.createStatement()) {
            s.execute("set search_path to "+schema);
            for(UUID id:java.util.List.of(owner,other))s.execute("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values('"+id+"','synthetic','"+id+"@example.test','hash',false,false)");
            s.execute("insert into accounts(id,name,type,balance,user_id,is_archived,opening_origin,opening_balance,opening_date,opening_recorded_at) values('"+account+"','legacy cash','CASH',999999999999.99,'"+owner+"',false,'SYSTEM_INITIALIZED',0,'2026-10-09',now())");
            s.execute("insert into onboarding_sessions(id,user_id,version,status,payload,issues,updated_at) values('"+session+"','"+owner+"',3,'IN_PROGRESS','{\"legacy\":true}','[]',now())");
        }
        var current=Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load();assertThat(current.migrate().migrationsExecuted).isEqualTo(1);current.validate();
        try(var connection=dataSource.getConnection();var s=connection.createStatement()) {
            s.execute("set search_path to "+schema);
            try(var rows=s.executeQuery("select balance::text,opening_origin from accounts")){assertThat(rows.next()).isTrue();assertThat(rows.getString(1)).isEqualTo("999999999999.99");assertThat(rows.getString(2)).isEqualTo("SYSTEM_INITIALIZED");}
            try(var rows=s.executeQuery("select version,payload from onboarding_sessions")){assertThat(rows.next()).isTrue();assertThat(rows.getLong(1)).isEqualTo(3);assertThat(rows.getString(2)).isEqualTo("{\"legacy\":true}");}
            try(var rows=s.executeQuery("select count(*) from onboarding_default_accounts")){rows.next();assertThat(rows.getInt(1)).isZero();}
            assertThatThrownBy(()->s.execute("insert into onboarding_default_accounts values('"+other+"','"+account+"',now())")).isInstanceOf(java.sql.SQLException.class);
            String first="insert into onboarding_preparations(operation_id,session_id,user_id,draft_version,state,content_hash,prepared_json,prepared_at) values('"+UUID.randomUUID()+"','"+session+"','"+owner+"',3,'PREPARED','"+"a".repeat(64)+"','{}',now())";s.execute(first);
            assertThatThrownBy(()->s.execute(first.replaceFirst("[0-9a-f-]{36}",UUID.randomUUID().toString()))).isInstanceOf(java.sql.SQLException.class);
            assertThatThrownBy(()->s.execute("update onboarding_preparations set state='UNKNOWN'")).isInstanceOf(java.sql.SQLException.class);
        }
        assertThat(current.migrate().migrationsExecuted).isZero();
    }
}
