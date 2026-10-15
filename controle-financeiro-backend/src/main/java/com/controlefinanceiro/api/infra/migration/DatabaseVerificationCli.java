package com.controlefinanceiro.api.infra.migration;

import java.io.PrintStream;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Map;

/** Separate operational entrypoint: no Spring bootstrap, baseline, migrate or DDL. */
public final class DatabaseVerificationCli {
    private DatabaseVerificationCli() { }
    public static void main(String[] args) { System.exit(run(args, System.getenv(), System.out)); }

    public static int run(String[] args, Map<String,String> env, PrintStream out) {
        try {
            if (args.length == 3 && args[0].equals("compare")) {
                var issues = RestoreSnapshot.compare(Path.of(args[1]),Path.of(args[2]));
                issues.forEach(out::println);
                out.println(issues.isEmpty() ? "RESTORE=EQUIVALENT" : "RESTORE=STOP");
                return issues.isEmpty() ? 0 : 2;
            }
            if (!(args.length == 3 && args[0].equals("preflight"))
                    && !(args.length == 4 && args[0].equals("snapshot"))) {
                out.println("Usage: preflight schema expectedDatabase | snapshot schema expectedDatabase newDirectory | compare before after");
                return 3;
            }
            String schema = args[1], database = args[2];
            PgSchemaInventory.identifier(schema);
            PgSchemaInventory.identifier(database);
            try (var c = DriverManager.getConnection(required(env,"CF017_JDBC_URL"),
                    required(env,"CF017_DB_USER"), required(env,"CF017_DB_PASSWORD"))) {
                try (var s = c.createStatement(); var r = s.executeQuery("SELECT current_database()")) {
                    r.next();
                    if (!database.equals(r.getString(1))) throw new IllegalArgumentException("Wrong target");
                }
                out.println("TARGET database=" + database + " schema=" + schema);
                if (args[0].equals("preflight")) {
                    var report = LegacyPreflight.inspect(c,schema);
                    out.print(report.render());
                    return report.compatible() ? 0 : 2;
                }
                PgSchemaInventory.beginReadOnly(c,schema);
                RestoreSnapshot.capture(c,Path.of(args[3]));
                out.println("SNAPSHOT=COMPLETE");
                return 0;
            }
        } catch (Exception e) {
            // Driver exceptions can contain connection properties: never print their messages.
            out.println("VERIFICATION=ERROR type=" + e.getClass().getSimpleName() + "; no authorization to proceed");
            return 3;
        }
    }

    private static String required(Map<String,String> env, String name) {
        String value = env.get(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing configuration");
        return value;
    }
}
