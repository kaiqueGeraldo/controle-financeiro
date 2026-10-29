package com.controlefinanceiro.api.infra.migration;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/** Logical snapshot, disk streamed. No values or credentials in diagnostics. */
public final class RestoreSnapshot {
    private static final Set<String> SUPPORTED_TYPES = Set.of("uuid", "varchar", "text", "bool", "int2",
            "int4", "int8", "numeric", "date", "time", "timestamp", "timestamptz", "jsonb", "bytea");
    private RestoreSnapshot() { }

    /** The connection must already have beginReadOnly; may share an exported snapshot with pg_dump. */
    public static void capture(Connection c, Path directory) throws Exception {
        if (c.getAutoCommit() || !c.isReadOnly()
                || c.getTransactionIsolation() != Connection.TRANSACTION_REPEATABLE_READ) {
            throw new IllegalArgumentException("Read-only repeatable-read transaction required");
        }
        // Never reuse a partial or stale output directory.
        Files.createDirectory(directory);
        var catalog = PgSchemaInventory.read(c);
        for (String item : catalog) {
            if (item.startsWith("routine\t") || item.startsWith("rule\t") || item.startsWith("policy\t")
                    || item.startsWith("trigger\t") || item.startsWith("type\t") || item.startsWith("inheritance\t")) {
                throw new IllegalArgumentException("Unsupported executable schema object; manual review required");
            }
        }
        write(directory.resolve("catalog.txt"), String.join("\n", catalog) + "\n");
        var tables = new ArrayList<String>();
        var sequences = new ArrayList<String>();
        try (var s = c.createStatement(); var r = s.executeQuery("""
                SELECT c.relname,c.relkind FROM pg_catalog.pg_class c
                JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
                WHERE n.nspname=current_schema() AND c.relkind NOT IN ('i','I')
                ORDER BY c.relname COLLATE "C"
                """)) {
            while (r.next()) {
                String name = r.getString(1);
                PgSchemaInventory.identifier(name);
                switch (r.getString(2)) {
                    case "r" -> tables.add(name);
                    case "S" -> sequences.add(name);
                    default -> throw new IllegalArgumentException("Unsupported relation: " + name);
                }
            }
        }
        for (String table : tables) captureTable(c, table, directory.resolve(table + ".rows"));
        var states = new ArrayList<String>();
        for (String sequence : sequences) {
            try (var s = c.createStatement(); var r = s.executeQuery("SELECT last_value,is_called FROM "
                    + PgSchemaInventory.identifier(sequence))) {
                r.next();
                states.add(sequence + "\t" + r.getString(1) + "\t" + r.getBoolean(2));
            }
        }
        write(directory.resolve("sequences.txt"), String.join("\n", states) + "\n");
        try (var s = c.createStatement(); var r = s.executeQuery("SELECT current_setting('server_version_num')::int / 10000")) {
            r.next();
            write(directory.resolve("COMPLETE"), "CF017 logical snapshot v1; PostgreSQL" + r.getInt(1)
                    + "; UTC; ISO; field-text SHA256\n");
        }
    }

    private static void captureTable(Connection c, String table, Path output) throws Exception {
        var columns = new ArrayList<String>();
        var keys = new ArrayList<String>();
        try (var s = c.prepareStatement("""
                SELECT a.attname,t.typname,coalesce(a.attnum=ANY(i.indkey),false)
                FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_type t ON t.oid=a.atttypid
                LEFT JOIN pg_catalog.pg_index i ON i.indrelid=a.attrelid AND i.indisprimary
                WHERE a.attrelid=to_regclass(?) AND a.attnum>0 AND NOT a.attisdropped
                ORDER BY a.attname COLLATE "C"
                """)) {
            s.setString(1, PgSchemaInventory.identifier(table));
            try (var r = s.executeQuery()) {
                while (r.next()) {
                    String name = r.getString(1);
                    if (!SUPPORTED_TYPES.contains(r.getString(2))) {
                        throw new SQLException("Unsupported type at " + table + "." + name);
                    }
                    PgSchemaInventory.identifier(name);
                    columns.add(name);
                    if (r.getBoolean(3)) keys.add(name);
                }
            }
        }
        // V1 habit_days has no PK; canonical complete-row multiset preserves duplicates.
        boolean multiset = keys.isEmpty();
        if (multiset) keys.addAll(columns);
        Set<String> keyNames = Set.copyOf(keys);
        String projection = columns.stream().map(name -> PgSchemaInventory.identifier(name) + "::text")
                .collect(Collectors.joining(","));
        String order = keys.stream().map(name -> PgSchemaInventory.identifier(name) + "::text COLLATE \"C\" NULLS FIRST")
                .collect(Collectors.joining(","));
        try (var writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
             var s = c.createStatement()) {
            s.setFetchSize(512);
            writer.write("key=" + (multiset ? "MULTISET" : String.join(",", keys))
                    + "\tfields=" + String.join(",", columns) + "\n");
            long count = 0;
            try (var r = s.executeQuery("SELECT " + projection + " FROM "
                    + PgSchemaInventory.identifier(table) + " ORDER BY " + order)) {
                while (r.next()) {
                    var keyDigest = digest();
                    var hashes = new ArrayList<String>(columns.size());
                    for (int i = 0; i < columns.size(); i++) {
                        String value = r.getString(i + 1);
                        // Null tag and byte length prevent ambiguous concatenation or null/value collapse.
                        byte[] encoded = encode(value);
                        hashes.add(HexFormat.of().formatHex(digest().digest(encoded)));
                        if (keyNames.contains(columns.get(i))) keyDigest.update(encoded);
                    }
                    writer.write(HexFormat.of().formatHex(keyDigest.digest()) + "\t" + String.join("\t", hashes) + "\n");
                    count++;
                }
            }
            writer.write("COUNT\t" + count + "\n");
        }
    }

    private static byte[] encode(String value) {
        if (value == null) return new byte[]{0};
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        return java.nio.ByteBuffer.allocate(5 + bytes.length).put((byte) 1).putInt(bytes.length).put(bytes).array();
    }

    private static MessageDigest digest() {
        try { return MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private static void write(Path file, String content) throws IOException {
        Files.writeString(file, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
    }

    /** Exact file comparison, bounded memory. Reports first differing row/field per table. */
    public static List<String> compare(Path before, Path after) throws IOException {
        if (!Files.exists(before.resolve("COMPLETE")) || !Files.exists(after.resolve("COMPLETE"))) {
            throw new IOException("Incomplete snapshot; comparison refused");
        }
        var issues = new ArrayList<String>();
        Set<String> left = files(before), right = files(after);
        var names = new TreeSet<>(left);
        names.addAll(right);
        for (String name : names) {
            if (!left.contains(name) || !right.contains(name)) {
                issues.add(name + " expected=" + left.contains(name) + " observed=" + right.contains(name));
                continue;
            }
            try (var a = Files.newBufferedReader(before.resolve(name)); var b = Files.newBufferedReader(after.resolve(name))) {
                long line = 0;
                String fields = "";
                while (true) {
                    String x = a.readLine(), y = b.readLine();
                    line++;
                    if (line == 1 && name.endsWith(".rows")) fields = String.valueOf(x);
                    if (!java.util.Objects.equals(x, y)) {
                        issues.add(name + " line=" + line + " fieldPositions=" + differentFields(x,y)
                                + (name.endsWith(".rows") ? " " + fields : "")
                                + " reason=logical content differs (values withheld)");
                        break;
                    }
                    if (x == null) break;
                }
            }
        }
        return List.copyOf(issues);
    }

    private static List<Integer> differentFields(String a, String b) {
        if (a == null || b == null) return List.of(-1);
        String[] x = a.split("\t", -1), y = b.split("\t", -1);
        var fields = new ArrayList<Integer>();
        for (int i=0; i<Math.max(x.length,y.length); i++) {
            if (i>=x.length || i>=y.length || !x[i].equals(y[i])) fields.add(i);
        }
        return fields;
    }

    private static Set<String> files(Path directory) throws IOException {
        try (var stream = Files.list(directory)) {
            return stream.map(p -> p.getFileName().toString()).collect(Collectors.toCollection(TreeSet::new));
        }
    }
}
