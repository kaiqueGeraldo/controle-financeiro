package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import javax.sql.DataSource;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@ContextConfiguration(initializers=OnboardingSchemaInitializer.class)
class OnboardingMigrationTest extends PostgresIntegrationTest {
    @Autowired DataSource dataSource;
    @Test void upgradeFromV14PreservesExistingDataAndAddsConstraints() throws Exception {
        String schema="cf029_upgrade_"+UUID.randomUUID().toString().replace("-","");UUID owner=UUID.randomUUID();
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("14").load().migrate();
        try(var c=dataSource.getConnection();var s=c.createStatement()) {
            c.setSchema(schema); // Let Hikari restore the application schema on return.
            s.execute("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values('"+owner+"','synthetic','upgrade@example.test','hash',false,false)");
            s.execute("insert into accounts(id,name,type,balance,user_id,is_archived) values('"+UUID.randomUUID()+"','legacy','CHECKING',999999999999.99,'"+owner+"',false)");
        }
        var upgraded=Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load();
        assertThat(upgraded.migrate().migrationsExecuted).isEqualTo(2);upgraded.validate();
        try(var c=dataSource.getConnection();var s=c.createStatement()) {
            c.setSchema(schema);
            try(var rs=s.executeQuery("select balance::text, opening_origin from accounts")){rs.next();assertThat(rs.getString(1)).isEqualTo("999999999999.99");assertThat(rs.getString(2)).isNull();}
            String insert="insert into onboarding_sessions(id,user_id,version,status,issues,updated_at) values('"+UUID.randomUUID()+"','"+owner+"',1,'SKIPPED','[]',now())";
            s.execute(insert);
            assertThatThrownBy(()->s.execute(insert.replaceFirst("[0-9a-f-]{36}",UUID.randomUUID().toString()))).isInstanceOf(java.sql.SQLException.class);
            assertThatThrownBy(()->s.execute("update onboarding_sessions set version=-1")).isInstanceOf(java.sql.SQLException.class);
            assertThatThrownBy(()->s.execute("update onboarding_sessions set status='IN_PROGRESS'")).isInstanceOf(java.sql.SQLException.class);
        }
    }
}
