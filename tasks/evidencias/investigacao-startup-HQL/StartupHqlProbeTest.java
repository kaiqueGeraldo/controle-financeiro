package com.controlefinanceiro.api.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

/** Finite diagnostic observations, NOT an approval of the original startup suite. */
class StartupHqlProbeTest {
    private static final Path ROOT = Path.of(System.getProperty("hql.runtime"));
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String IMAGE = "sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1";
    private static String schema;

    @BeforeAll static void prepareDisposableSchema() throws Exception {
        schema = Cf017PostgresSupport.createSchema("startup_hql");
        var migration = Cf017PostgresSupport.flyway(schema).migrate();
        assertThat(migration.migrationsExecuted).isEqualTo(16);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement();
             var r = s.executeQuery("SELECT count(*) FROM " + schema + ".flyway_schema_history WHERE success")) {
            r.next(); assertThat(r.getInt(1)).isEqualTo(16);
        }
        JSON.writerWithDefaultPrettyPrinter().writeValue(ROOT.resolve("database-ready.json").toFile(), Map.of(
                "at", Instant.now().toString(), "schema", schema, "migrations", 16,
                "jdbc", Cf017PostgresSupport.schemaJdbcUrl(schema), "major", "17", "beforeApplicationCreation", true));
    }

    @ParameterizedTest
    @ValueSource(strings = {"native-control", "image-control", "native-instrumented", "image-instrumented"})
    void boundedObservation(String name) throws Exception {
        boolean image = name.startsWith("image"), instrumented = name.endsWith("instrumented");
        Path folder = ROOT.resolve(name);
        Files.createDirectory(folder);
        if (image) System.setProperty("preparation.image", IMAGE); else System.clearProperty("preparation.image");
        if (instrumented) {
            String agent = image ? "/diagnostic/boot-agent.jar" : ROOT.resolve("agent/boot-agent.jar").toString();
            System.setProperty("hql.jvm.options", "-javaagent:" + agent
                    + " -XX:StartFlightRecording=name=boot,settings=profile,dumponexit=true");
            System.setProperty("hql.agent.mount", ROOT.resolve("agent").toString());
        } else System.clearProperty("hql.jvm.options");
        var record = new LinkedHashMap<String,Object>();
        List<Map<String,Object>> samples = Collections.synchronizedList(new ArrayList<>());
        var sampling = new AtomicBoolean(true);
        record.put("name", name); record.put("instrumented", instrumented);
        record.put("configuration", "adoption; writers=true; jobs=false; JDBC connect/socket2s; dynamic actual port; PG17 migrated before t0");
        record.put("heap", image ? "image ergonomics, no explicit limit" : "-Xmx384m");
        AdoptionRuntimeTest.App app = null;
        Thread sampler = null;
        Throwable unexpected = null;
        try {
            app = new AdoptionRuntimeTest.App(schema, true, false);
            final var owned = app;
            long t0 = app.creationNanos;
            record.put("creationWallUtc", app.creationWall.toString());
            record.put("creationNano", Long.toString(t0));
            record.put("startReturnedMs", ms(t0));
            record.put("clientPid", app.process.pid());
            record.put("clientBirth", app.process.info().startInstant().orElseThrow().toString());
            record.put("container", app.containerName == null ? "none" : app.containerName);
            record.put("log", app.log.toAbsolutePath().toString());
            sampler = Thread.ofPlatform().daemon().start(() -> sample(owned, t0, sampling, samples, image));
            long gate = System.nanoTime();
            record.put("gateStartMs", ms(t0));
            try {
                app.awaitStatus("/ops/health/readiness", 200);
                long ready = System.nanoTime();
                record.put("originalAwaitReturnedSuccess", true);
                record.put("readinessMs", TimeUnit.NANOSECONDS.toMillis(ready-t0));
                record.put("gateElapsedMs", TimeUnit.NANOSECONDS.toMillis(ready-gate));
                record.put("within40SecondsFromGate", ready-gate <= Duration.ofSeconds(40).toNanos());
                record.put("within40SecondsFromCreation", ready-t0 <= Duration.ofSeconds(40).toNanos());
            } catch (AssertionError originalFailure) {
                record.put("originalAwaitReturnedSuccess", false);
                record.put("within40SecondsFromGate", false);
                record.put("within40SecondsFromCreation", false);
                record.put("gateElapsedMs", ms(gate));
                record.put("failureAtMs", ms(t0));
                record.put("aliveAtFailure", app.process.isAlive());
                Files.writeString(folder.resolve("original-failure.txt"), originalFailure.toString(), StandardOpenOption.CREATE_NEW);
                if (app.process.isAlive()) command(folder.resolve("threads-after-failure.txt"),
                        image ? List.of("docker","exec",app.containerName,"jcmd","1","Thread.print")
                                : List.of(jcmd(),Long.toString(app.process.pid()),"Thread.print"));
                while (app.process.isAlive() && ms(t0)<90000) {
                    if (app.port == 0) discoverPortForDiagnostic(app, image);
                    if (app.port>0) {
                        try { if (app.call("GET","/ops/health/readiness",null,null).statusCode()==200) {
                            record.put("diagnosticReadinessMs",ms(t0)); break;
                        }} catch (java.io.IOException starting) { /* Separate post-gate diagnosis. */ }
                    }
                    Thread.sleep(100);
                }
            }
            record.put("port", app.port);
            record.put("aliveAfterObservation", app.process.isAlive());
            if (app.process.isAlive() && app.port>0) {
                long probe = System.nanoTime();
                record.put("liveness", app.call("GET","/ops/health/liveness",null,null).statusCode());
                record.put("livenessObservedMs",ms(t0));
                record.put("livenessProbeMs",ms(probe));
                record.put("functionalUnauthenticatedAccounts", app.call("GET","/accounts",null,null).statusCode());
                record.put("functionalObservedMs",ms(t0));
            }
            if (instrumented && app.process.isAlive()) {
                String filename = image ? "/diagnostic/"+name+".jfr" : ROOT.resolve("agent/"+name+".jfr").toString();
                long dump = System.nanoTime();
                record.put("jfrDumpExit", command(folder.resolve("jfr-dump.txt"), image
                        ? List.of("docker","exec",app.containerName,"jcmd","1","JFR.dump","name=boot","filename="+filename)
                        : List.of(jcmd(),Long.toString(app.process.pid()),"JFR.dump","name=boot","filename="+filename)));
                record.put("jfrDumpMs",ms(dump));
            }
        } catch (Throwable failure) {
            unexpected = failure;
            record.put("observerFailure",failure.toString());
        } finally {
            sampling.set(false);
            if (sampler != null) { sampler.interrupt(); sampler.join(2000); }
            if (app != null) {
                long closing=System.nanoTime();
                try { app.close(); record.put("cleanupConfirmed",true); }
                catch (Throwable failure) { record.put("cleanupFailure",failure.toString()); if (unexpected==null) unexpected=failure; }
                record.put("closeMs",ms(closing));
                record.put("aliveAfterCleanup",app.process.isAlive());
                if (!app.process.isAlive()) record.put("exitAfterCleanup",app.process.exitValue());
                Files.copy(app.log,folder.resolve("process.log"));
            }
            record.put("samples",samples);
            JSON.writerWithDefaultPrettyPrinter().writeValue(folder.resolve("observation.json").toFile(),record);
            System.clearProperty("hql.jvm.options"); System.clearProperty("preparation.image");
        }
        System.out.println("HQL_OBSERVATION " + name + " " + record.get("gateElapsedMs") + "ms originalSuccess=" + record.get("originalAwaitReturnedSuccess"));
        if (unexpected != null) throw new AssertionError("Diagnostic failure (original gate recorded separately)",unexpected);
    }

    private static void sample(AdoptionRuntimeTest.App app,long t0,AtomicBoolean sampling,List<Map<String,Object>> samples,boolean image) {
        var host=(com.sun.management.OperatingSystemMXBean)java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        Set<String> seen = new HashSet<>();
        while(sampling.get()) {
            long start=System.nanoTime();
            var s=new LinkedHashMap<String,Object>();
            s.put("ms",ms(t0)); s.put("clientCpuMs",app.process.info().totalCpuDuration().orElse(Duration.ZERO).toMillis());
            s.put("clientCpuIsApplicationCpu",!image); s.put("hostCpuLoad",host.getCpuLoad());
            s.put("hostFreeMemoryBytes",host.getFreeMemorySize()); s.put("hostTotalMemoryBytes",host.getTotalMemorySize());
            s.put("processors",host.getAvailableProcessors());
            try {
                String log=Files.readString(app.log);
                for(String mark:List.of("Starting ControleFinanceiro", "Finished Spring Data repository scanning", "Tomcat initialized",
                        "HikariPool-1 - Added connection", "Initialized JPA EntityManagerFactory", "HQL parser will be used",
                        "Tomcat started on port", "Started ControleFinanceiro", "Initializing Servlet")) {
                    if(log.contains(mark)&&seen.add(mark))s.put(mark+"ObservedMs",ms(t0));
                }
            } catch(Exception failure) { s.put("error",failure.toString()); }
            s.put("observerWorkMs",ms(start)); samples.add(s);
            try { Thread.sleep(1000); } catch(InterruptedException stopped) { return; }
        }
    }

    private static void discoverPortForDiagnostic(AdoptionRuntimeTest.App app,boolean image) throws Exception {
        var match=java.util.regex.Pattern.compile("Tomcat started on port (\\d+)").matcher(Files.readString(app.log));
        if(!match.find())return;
        if(!image)app.port=Integer.parseInt(match.group(1));
        else {
            Path output=ROOT.resolve("docker-port-"+app.process.pid()+".txt");
            assertThat(command(output,List.of("docker","port",app.containerName,"8080/tcp"))).isZero();
            String value=Files.readString(output).trim();
            assertThat(value).startsWith("127.0.0.1:");
            app.port=Integer.parseInt(value.substring(value.lastIndexOf(':')+1));
        }
    }
    private static String jcmd() {return Path.of(System.getProperty("java.home"),"bin","jcmd.exe").toString();}
    private static int command(Path output,List<String> command) throws Exception {
        var p=new ProcessBuilder(command).redirectErrorStream(true).redirectOutput(output.toFile()).start();
        if(!p.waitFor(10,TimeUnit.SECONDS)) {p.destroyForcibly();p.waitFor(2,TimeUnit.SECONDS);throw new IllegalStateException("Diagnostic command timeout: "+command.getFirst());}
        return p.exitValue();
    }
    private static long ms(long start) {return TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);}
}
