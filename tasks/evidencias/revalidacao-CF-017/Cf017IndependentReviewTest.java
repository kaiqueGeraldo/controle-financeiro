package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.migration.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import static org.assertj.core.api.Assertions.*;

/** Independent reviewer probes. Literal expectations do not use the production encoder/catalog. */
class Cf017IndependentReviewTest {
    @Test void literalOracleForDecimalNullAndDelimiterText(@TempDir Path temp) throws Exception {
        String schema=Cf017PostgresSupport.createSchema("rv17_literals");
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()) {
            s.execute("SET search_path TO "+schema);
            s.execute("CREATE TABLE probe(id integer PRIMARY KEY, amount numeric(38,8), raw text)");
            s.execute("INSERT INTO probe VALUES (1,123456789012345678901234567890.12345678,E'a\\tb\\nc'),(2,NULL,''),(3,0.00000001,NULL)");
        }
        Cf017PreflightTest.snapshot(schema,temp.resolve("before"));
        var lines=Files.readAllLines(temp.resolve("before/probe.rows"));
        assertThat(lines).hasSize(5);
        assertThat(lines.get(0)).isEqualTo("key=id\tfields=amount,id,raw");
        assertThat(lines.get(1).split("\t")).containsExactly(hash("1"),hash("123456789012345678901234567890.12345678"),hash("1"),hash("a\tb\nc"));
        assertThat(lines.get(2).split("\t")).containsExactly(hash("2"),hash(null),hash("2"),hash(""));
        assertThat(lines.get(3).split("\t")).containsExactly(hash("3"),hash("0.00000001"),hash("3"),hash(null));
        assertThat(lines.get(4)).isEqualTo("COUNT\t3");
        Files.createDirectory(temp.resolve("cycle")); Cf017RestoreTest.roundTrip(schema,temp.resolve("cycle"));
        System.out.println("REVIEW literal-decimal-null-text oracle=PASS real-dump=PASS");
    }
    private static String hash(String value) throws Exception {
        // Independent framing via stream, with explicit literal values from INSERT above.
        var bytes=new java.io.ByteArrayOutputStream();
        var out=new java.io.DataOutputStream(bytes);
        out.writeByte(value==null ? 0 : 1);
        if(value!=null) { byte[] data=value.getBytes(StandardCharsets.UTF_8);out.writeInt(data.length);out.write(data); }
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes.toByteArray()));
    }
    @Test void foreignSchemaFkCannotMasqueradeAsLocalReference() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("rv17_target");
        String other=Cf017PostgresSupport.createSchema("rv17_other");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()) {
            s.execute("CREATE TABLE "+other+".users AS TABLE "+schema+".users");
            s.execute("ALTER TABLE "+other+".users ADD PRIMARY KEY(id)");
            s.execute("ALTER TABLE "+schema+".accounts DROP CONSTRAINT accounts_user_id_fkey");
            s.execute("ALTER TABLE "+schema+".accounts ADD FOREIGN KEY(user_id) REFERENCES "+other+".users(id)");
        }
        try(var c=Cf017PostgresSupport.connect()) {
            var report=LegacyPreflight.inspect(c,schema);
            assertThat(report.compatible()).isFalse();
            assertThat(report.render()).contains(other+".users", "INCOMPATIBLE", "REVIEW_REQUIRED");
        }
        System.out.println("REVIEW external-same-name-fk=STOP");
    }
    @Test void previousPassDoesNotAuthorizeChangedSchema() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("rv17_stale");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        assertThat(Cf017PreflightTest.code(schema)).isZero();
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()) {
            s.execute("ALTER TABLE "+schema+".accounts DROP CONSTRAINT accounts_user_id_fkey");
        }
        assertThat(Cf017PreflightTest.code(schema)).isEqualTo(2);
        // Deliberately bypass the gate in this owned disposable schema: Flyway cannot substitute for it.
        assertThat(Cf017PostgresSupport.flyway(schema).baseline().successfullyBaselined).isTrue();
        assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isEqualTo(13);
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement();var r=s.executeQuery(
            "SELECT count(*) FROM pg_constraint WHERE conrelid='"+schema+".accounts'::regclass AND contype='f'")) {
            r.next();assertThat(r.getInt(1)).isZero();
        }
        System.out.println("REVIEW stale-pass: first=0 second=2 bypass-baseline=true missing-fk-after-V14=true");
    }
    @Test void restoreLosesNeitherRowsNorEmptyTable(@TempDir Path temp) throws Exception {
        String schema=Cf017PostgresSupport.createSchema("rv17_multiset");
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()) {
            s.execute("SET search_path TO "+schema);
            s.execute("CREATE TABLE duplicates(raw text); CREATE TABLE empty_table(id integer)");
            s.execute("INSERT INTO duplicates VALUES(NULL),(NULL),(''),('x'),('x')");
        }
        String restored=Cf017RestoreTest.roundTrip(schema,temp);
        assertThat(Files.readAllLines(temp.resolve("before/duplicates.rows"))).hasSize(7).last().isEqualTo("COUNT\t5");
        assertThat(Files.readAllLines(temp.resolve("before/empty_table.rows"))).hasSize(2).last().isEqualTo("COUNT\t0");
        try(var c=Cf017PostgresSupport.connectRestore(restored);var s=c.createStatement()) {
            s.execute("DELETE FROM "+schema+".duplicates WHERE ctid=(SELECT ctid FROM "+schema+".duplicates WHERE raw IS NULL LIMIT 1)");
        }
        try(var c=Cf017PostgresSupport.connectRestore(restored)) {
            PgSchemaInventory.beginReadOnly(c,schema);RestoreSnapshot.capture(c,temp.resolve("mutant"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("mutant"))).anyMatch(x->x.startsWith("duplicates.rows"));
        // Roll back the deliberate deletion by restoring the exact duplicate null row, then verify all files.
        try(var c=Cf017PostgresSupport.connectRestore(restored);var s=c.createStatement()) {s.execute("INSERT INTO "+schema+".duplicates VALUES(NULL)");}
        try(var c=Cf017PostgresSupport.connectRestore(restored)) {PgSchemaInventory.beginReadOnly(c,schema);RestoreSnapshot.capture(c,temp.resolve("final"));}
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("final"))).isEmpty();
        System.out.println("REVIEW duplicate-null-deletion=DETECTED empty-table=CAPTURED final=EQUIVALENT");
    }
}
