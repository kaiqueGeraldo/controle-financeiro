package com.controlefinanceiro.api.migration;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

/** Directed reproductions of the independent review, kept as regression criteria. */
class Cf017OriginalFindingsTest {
    @Test
    void compatibleFixturePasses() {
        String schema = Cf017PostgresSupport.createSchema("cf017_original_ok");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        Cf017PostgresSupport.assertLegacyV1Preflight(schema);
    }

    @Test
    void missingOriginalForeignKeyStopsBeforeBaseline() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_original_fk");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("ALTER TABLE " + schema + ".accounts DROP CONSTRAINT accounts_user_id_fkey");
        }
        assertThatThrownBy(() -> Cf017PostgresSupport.assertLegacyV1Preflight(schema))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rawTimestampChangeMustChangeRestoreFingerprint() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_original_raw");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        Cf017PostgresSupport.flyway(schema).baseline();
        Cf017PostgresSupport.flyway(schema).migrate();
        var oracle = LegacyDatabaseMigrationIntegrationTest.class.getDeclaredMethod("fingerprint", String.class);
        oracle.setAccessible(true);
        var fixture = new LegacyDatabaseMigrationIntegrationTest();
        Object before = oracle.invoke(fixture, schema);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("UPDATE " + schema + ".transactions SET created_at=created_at + interval '1 microsecond'");
        }
        assertThat(oracle.invoke(fixture, schema)).isNotEqualTo(before);
    }
}
