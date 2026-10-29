package com.controlefinanceiro.api.migration;

import org.junit.jupiter.api.Test;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.net.*;
import java.net.http.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;

/** Independent observer. 40s is recorded unchanged; 100s is diagnosis only. */
class StartupDiagnosticTest {
    private final Path root=Path.of(System.getProperty("review.runtime"));
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();
    private final List<Map<String,Object>> results=new ArrayList<>();

    @Test void observeActualJarAndImageWithoutChangingFortySecondGate() throws Exception {
        Files.createDirectories(root.resolve("startup"));
        String schema=Cf017PostgresSupport.createSchema("review_startup");
        Cf017PostgresSupport.flyway(schema).migrate();
        for(String mode:List.of("native","image")) observe(mode,schema);
        new com.fasterxml.jackson.databind.ObjectMapper().writerWithDefaultPrettyPrinter()
                .writeValue(root.resolve("startup/results.json").toFile(),results);
    }
    private void observe(String mode,String schema) throws Exception {
        boolean image=mode.equals("image");
        String container="cf-review-startup-"+UUID.randomUUID();
        int port;
        try(var socket=new ServerSocket(0)){port=socket.getLocalPort();}
        String java=Path.of(System.getProperty("java.home"),"bin","java").toString();
        String jdbc=Cf017PostgresSupport.schemaJdbcUrl(schema)+"&connectTimeout=2&socketTimeout=2";
        if(image)jdbc=jdbc.replace("//localhost:","//host.docker.internal:");
        Map<String,String> config=new HashMap<>(Map.of("SPRING_DATASOURCE_URL",jdbc,
                "SPRING_DATASOURCE_USERNAME",Cf017PostgresSupport.username(),
                "SPRING_DATASOURCE_PASSWORD",Cf017PostgresSupport.password(),
                "JWT_SECRET","synthetic-review-secret-at-least-32-chars", "BRAPI_TOKEN","synthetic-unused",
                "RESEND_API_KEY","synthetic-unused","EMAIL_RESEND","no-reply@example.test","FRONT_URL","http://localhost"));
        List<String> command=new ArrayList<>();
        if(image){
            command.addAll(List.of("docker","run","--rm","--name",container,"--label","cf.review.adoption=true",
                    "-p","127.0.0.1:"+port+":8080"));
            config.forEach((k,v)->command.addAll(List.of("--env",k+"="+v)));
            command.add(System.getProperty("preparation.image"));
        }else command.addAll(List.of(java,"-Xmx384m","-jar",System.getProperty("preparation.jar")));
        command.addAll(List.of("--spring.profiles.active=adoption","--server.port="+(image?8080:port),
                "--app.operations.writers-enabled=true","--app.operations.jobs-enabled=false"));
        Path log=root.resolve("startup/"+mode+".log");
        var builder=new ProcessBuilder(command).redirectErrorStream(true).redirectOutput(log.toFile());
        builder.environment().keySet().removeIf(k->k.startsWith("SPRING_")||k.startsWith("DB_")||k.startsWith("FLYWAY_")
                ||Set.of("JAVA_TOOL_OPTIONS","JDK_JAVA_OPTIONS","_JAVA_OPTIONS").contains(k));
        builder.environment().putAll(config);
        long start=System.nanoTime();
        Instant wall=Instant.now();
        Process process=builder.start();
        List<Map<String,Object>> events=new ArrayList<>();
        events.add(Map.of("event","process-created","ms",ms(start),"pid",process.pid()));
        boolean live=false,ready=false,forty=false;
        Integer priorLive=null,priorReady=null;
        try {
            while(process.isAlive() && ms(start)<100000 && !ready){
                int l=status(port,"liveness"),r=status(port,"readiness");
                long elapsed=ms(start);
                if(!Objects.equals(priorLive,l)||!Objects.equals(priorReady,r)) {
                    events.add(Map.of("event","probes","ms",elapsed,"liveness",l,"readiness",r));
                    priorLive=l;priorReady=r;
                }
                if(l==200&&!live){live=true;events.add(Map.of("event","first-liveness-200","ms",elapsed));}
                if(r==200){ready=true;events.add(Map.of("event","first-readiness-200","ms",elapsed));}
                if(elapsed>=40000&&!forty){
                    forty=true;
                    events.add(Map.of("event","original-40s-exceeded","ms",elapsed,"alive",process.isAlive(),
                            "cpuMs",process.info().totalCpuDuration().orElse(Duration.ZERO).toMillis()));
                    List<String> dump=image?List.of("docker","exec",container,"jcmd","1","Thread.print"):
                            List.of(Path.of(System.getProperty("java.home"),"bin","jcmd").toString(),Long.toString(process.pid()),"Thread.print");
                    var jcmd=new ProcessBuilder(dump).redirectErrorStream(true).redirectOutput(root.resolve("startup/"+mode+"-threads-40s.txt").toFile()).start();
                    if(!jcmd.waitFor(10,TimeUnit.SECONDS))jcmd.destroyForcibly();
                }
                if(!ready)Thread.sleep(100);
            }
            events.add(Map.of("event","diagnostic-observation-ended","ms",ms(start),"alive",process.isAlive(),"ready",ready));
            if(ready){
                Cf017PostgresSupport.pauseServer();
                try{
                    long down=System.nanoTime();int r=status(port,"readiness"),l=status(port,"liveness");
                    events.add(Map.of("event","db-paused","readiness",r,"liveness",l,"probeMs",ms(down)));
                    assertThat(r).isEqualTo(503);assertThat(l).isEqualTo(200);
                }finally{Cf017PostgresSupport.resumeServer();}
                long recovery=System.nanoTime();int r;
                do{r=status(port,"readiness");if(r!=200)Thread.sleep(100);}while(r!=200&&ms(recovery)<10000);
                events.add(Map.of("event","db-returned","readiness",r,"ms",ms(start),"samePid",process.pid()));
                assertThat(r).isEqualTo(200);
            }
        }finally{
            if(image)new ProcessBuilder("docker","stop","--time","10",container).redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .redirectErrorStream(true).start().waitFor(20,TimeUnit.SECONDS);
            process.destroy();if(!process.waitFor(10,TimeUnit.SECONDS)){process.destroyForcibly();process.waitFor(5,TimeUnit.SECONDS);}
            events.add(Map.of("event","cleanup","ms",ms(start),"alive",process.isAlive(),"exit",process.isAlive()?-999:process.exitValue()));
            results.add(Map.of("mode",mode,"wallStartUtc",wall.toString(),"port",port,"events",events,
                    "originalBudgetMs",40000,"diagnosticBudgetMs",100000,"originalBudgetPassed",ready&&!forty,
                    "jar",System.getProperty("preparation.jar"),"image",System.getProperty("preparation.image"),
                    "profile","adoption; writers=true; jobs=false; JDBC local disposable connect/socket 2s"));
        }
    }
    private int status(int port,String endpoint){
        try{return http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/ops/health/"+endpoint))
                .timeout(Duration.ofSeconds(8)).GET().build(),HttpResponse.BodyHandlers.discarding()).statusCode();}
        catch(Exception e){return -1;}
    }
    private static long ms(long start){return TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);}
}
