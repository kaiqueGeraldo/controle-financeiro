package com.controlefinanceiro.api;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ContextConfiguration;
import static org.assertj.core.api.Assertions.*;

/** Explicit directed probe; not an additional identity in smoke/expanded. */
class Pr3FixtureIsolationProbe {
    private GenericApplicationContext context(Class<?> owner) throws Exception {
        var context = new GenericApplicationContext();
        var type=owner.getAnnotation(ContextConfiguration.class).initializers()[0];
        type.getMethod("initialize",org.springframework.context.ConfigurableApplicationContext.class)
                .invoke(type.getDeclaredConstructor().newInstance(),context);
        return context;
    }
    private JdbcTemplate database(GenericApplicationContext context) {
        var env = context.getEnvironment();
        String url = env.getRequiredProperty("spring.datasource.url");
        String user = env.getRequiredProperty("spring.datasource.username");
        String password = env.getRequiredProperty("spring.datasource.password");
        Flyway.configure().dataSource(url,user,password)
                .defaultSchema(env.getRequiredProperty("spring.flyway.default-schema"))
                .locations("classpath:db/migration").load().migrate();
        return new JdbcTemplate(new DriverManagerDataSource(url,user,password));
    }
    private void produce(JdbcTemplate sql) {
        sql.update("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values ('aaaaaaaa-0000-4000-8000-000000000001','Producer','producer@example.invalid','unused',true,false)");
        sql.update("insert into investments(id,ticker,name,type,quantity,average_price,current_price,user_id,version,total_cost) values ('aaaaaaaa-0000-4000-8000-000000000010','PRODUCER','Foreign fixture','OTHER',70,10,10,'aaaaaaaa-0000-4000-8000-000000000001',0,700)");
        sql.update("insert into invest_transactions(id,type,date,quantity,price,total_value,fees,investment_id,operation_date,date_origin,cost_delta) select gen_random_uuid(),'BUY',date '2027-01-15',1,10,10,0,'aaaaaaaa-0000-4000-8000-000000000010',date '2027-01-15','USER_INPUT',10 from generate_series(1,70)");
    }
    @Test void recreatingAnOwnerDoesNotReuseItsPreviousSchema() throws Exception {
        try(var first=context(Cf014HistoryReviewTest.class);var second=context(Cf014HistoryReviewTest.class)) {
            assertThat(first.getEnvironment().getRequiredProperty("spring.flyway.default-schema"))
                    .isNotEqualTo(second.getEnvironment().getRequiredProperty("spring.flyway.default-schema"));
        }
    }
    @Test void independentContextsInBothOrders() throws Exception {
        for(var order:java.util.List.of(java.util.List.of(Cf014HistoryReviewTest.class,Cf014HistoryDiagnosticTest.class),java.util.List.of(Cf014HistoryDiagnosticTest.class,Cf014HistoryReviewTest.class))) {
            try(var first=context(order.get(0));var second=context(order.get(1))) {
                assertThat(first.getEnvironment().getRequiredProperty("spring.flyway.default-schema"))
                        .isNotEqualTo(second.getEnvironment().getRequiredProperty("spring.flyway.default-schema"));
                var producer=database(first);var consumer=database(second);produce(producer);
                assertThat(consumer.queryForObject("select count(*) from invest_transactions",Integer.class)).isZero();
                // The same original fixed identity must be valid in each context.
                for(var sql:java.util.List.of(producer,consumer))sql.update("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values (?,'CF014','cf014-diagnostic@example.invalid','unused',true,false)",Cf014HistoryReviewTest.id(1));
                assertThat(producer.queryForObject("select count(*) from invest_transactions",Integer.class)).isEqualTo(70);
                assertThat(consumer.queryForObject("select count(*) from transactions",Integer.class)).isZero();
            }
        }
    }
}
