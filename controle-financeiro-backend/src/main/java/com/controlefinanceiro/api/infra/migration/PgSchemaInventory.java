package com.controlefinanceiro.api.infra.migration;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** Catalog only: never creates a reference schema on the inspected target. */
public final class PgSchemaInventory {
    // PostgreSQL 16 dump/reparse distributes varchar[] -> text[] over literal
    // elements. Only this exact enum-literal form is equivalent here; no general
    // SQL rewriting, no typmod removal, no literal values/order discarded.
    private static final String ENUM_LITERAL = "'[A-Z_][A-Z_0-9]*'";
    private static final java.util.regex.Pattern ARRAY_CAST = java.util.regex.Pattern.compile(
            "\\(ARRAY\\[((?:" + ENUM_LITERAL + "::character varying)(?:, " + ENUM_LITERAL
                    + "::character varying)*)\\]\\)::text\\[\\]");
    private static final java.util.regex.Pattern ELEMENT_CAST = java.util.regex.Pattern.compile(
            "ARRAY\\[((?:\\(" + ENUM_LITERAL + "::character varying\\)::text)(?:, \\(" + ENUM_LITERAL
                    + "::character varying\\)::text)*)\\]");
    private PgSchemaInventory() { }

    public static String identifier(String name) {
        // A deliberately narrow operational interface, also safe for file names.
        if (name == null || !name.matches("[a-z_][a-z0-9_]{0,62}")) {
            throw new IllegalArgumentException("Unsupported identifier");
        }
        return '"' + name + '"';
    }

    /** Caller owns this fresh connection/transaction; rollback/close after use. */
    public static void beginReadOnly(Connection c, String schema) throws SQLException {
        if (!c.getAutoCommit()) throw new IllegalArgumentException("Fresh connection required");
        identifier(schema);
        c.setReadOnly(true);
        c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
        c.setAutoCommit(false);
        try (var s = c.createStatement()) {
            s.execute("SET LOCAL search_path TO " + identifier(schema) + ", pg_catalog");
            s.execute("SET LOCAL timezone TO 'UTC'");
            s.execute("SET LOCAL datestyle TO 'ISO, YMD'");
            s.execute("SET LOCAL intervalstyle TO 'iso_8601'");
            s.execute("SET LOCAL extra_float_digits TO 3");
            s.execute("SET LOCAL bytea_output TO 'hex'");
            s.execute("SET LOCAL row_security TO off");
            s.execute("SET LOCAL lock_timeout TO '5s'");
            s.execute("SET LOCAL statement_timeout TO '120s'");
            try (var r = s.executeQuery("SELECT current_schema(),current_setting('server_version_num')::int")) {
                r.next();
                if (!schema.equals(r.getString(1))) throw new SQLException("Target schema absent/inaccessible");
                if (r.getInt(2) / 10000 != 16) throw new SQLException("Only PostgreSQL 16 verified");
            }
        }
    }

    public static List<String> read(Connection c) throws SQLException, IOException {
        var result = new ArrayList<String>();
        try (var s = c.createStatement(); var r = s.executeQuery(resource("catalog.sql"))) {
            while (r.next()) {
                String kind = r.getString(1), definition = r.getString(3);
                if (kind.equals("constraint") && definition.startsWith("[\"c\",")) {
                    definition = ARRAY_CAST.matcher(definition).replaceAll(match ->
                            java.util.regex.Matcher.quoteReplacement("ARRAY[" + match.group(1).replace("::character varying", "::text") + "]"));
                    definition = ELEMENT_CAST.matcher(definition).replaceAll(match ->
                            java.util.regex.Matcher.quoteReplacement("ARRAY[" + match.group(1)
                                    .replace("(", "").replace("::character varying)::text", "::text") + "]"));
                }
                result.add(kind + "\t" + r.getString(2) + "\t" + definition);
            }
        }
        // Java order is the manifest order, independent of DB collation/locale.
        result.sort(String::compareTo);
        return List.copyOf(result);
    }

    public static String resource(String name) throws IOException {
        try (var in = PgSchemaInventory.class.getResourceAsStream("/db/verification/" + name)) {
            if (in == null) throw new IOException("Missing verification resource " + name);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
