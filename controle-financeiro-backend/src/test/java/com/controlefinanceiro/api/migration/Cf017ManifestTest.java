package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.migration.PgSchemaInventory;
import com.controlefinanceiro.api.infra.migration.LegacyPreflight;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import static org.assertj.core.api.Assertions.assertThat;

class Cf017ManifestTest {
    @Test void checkedInManifestMatchesFrozenV1NotCurrentEntities() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_reference");
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET search_path TO " + schema);
            ScriptUtils.executeSqlScript(c, new ClassPathResource("db/migration/V1__baseline_pre_temporal.sql"));
        }
        try (var c = Cf017PostgresSupport.connect()) {
            PgSchemaInventory.beginReadOnly(c, schema);
            assertThat(PgSchemaInventory.read(c)).containsExactlyElementsOf(LegacyPreflight.expected());
        }
    }
}
