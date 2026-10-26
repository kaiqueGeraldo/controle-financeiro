package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Inspect every pooled connection so a leaked migration search_path is observable. */
@TestPropertySource(properties = {
        "spring.datasource.hikari.maximum-pool-size=2",
        "spring.datasource.hikari.minimum-idle=2"
})
class OnboardingMigrationPoolIsolationTest extends OnboardingApplicationSupport {
    @Autowired DataSource dataSource;
    @Autowired Environment environment;

    @Test void v14UpgradeReturnsConnectionToApplicationSchema() throws Exception {
        var fixture = new OnboardingMigrationTest();
        fixture.dataSource = dataSource;
        fixture.upgradeFromV14PreservesExistingDataAndAddsConstraints();
        assertApplicationConnection();
    }

    @Test void v15UpgradeReturnsConnectionToApplicationSchema() throws Exception {
        var fixture = new OnboardingV16MigrationTest();
        fixture.dataSource = dataSource;
        fixture.upgradeV15PreservesLegacyAndAddsApplicationConstraintsWithoutGuessingDefault();
        assertApplicationConnection();
    }

    private void assertApplicationConnection() throws Exception {
        String expected = environment.getRequiredProperty("spring.jpa.properties.hibernate.default_schema");
        // Flyway needs two slots. Borrow both before returning either, avoiding
        // any dependence on which physical connection the pool hands out first.
        try (var first = dataSource.getConnection(); var second = dataSource.getConnection()) {
            assertThat(first.getSchema()).isEqualTo(expected);
            assertThat(second.getSchema()).isEqualTo(expected);
        }
        var accountId = account("1.00");
        assertThat(sql.queryForObject("select user_id from accounts where id=?", java.util.UUID.class, accountId))
                .isEqualTo(user.getId());
    }
}
