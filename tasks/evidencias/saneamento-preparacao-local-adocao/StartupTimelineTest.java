package com.controlefinanceiro.api.migration;
import org.junit.jupiter.api.Test;
import java.net.*;import java.net.http.*;import java.nio.file.*;import java.time.*;import java.util.*;import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;

/** Two diagnostic processes only. 90s observation never replaces the original 40s gate. */
class StartupTimelineTest {
 final Path root=Path.of(System.getProperty("diagnostic.runtime"));
 final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();
 final List<Map<String,Object>> results=new ArrayList<>();
 @Test void observeRealQuerySequenceAndJfrWithUnchangedPackage()throws Exception {
  String schema=Cf017PostgresSupport.createSchema("startup_timeline");Cf017PostgresSupport.flyway(schema).migrate();
  try {for(String mode:List.of("native","image"))observe(mode,schema);}
  finally {new com.fasterxml.jackson.databind.ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(root.resolve("timeline.json").toFile(),results);}
 }
 void observe(String mode,String schema)throws Exception {
  boolean image=mode.equals("image");Path folder=root.resolve(mode);Files.createDirectory(folder);
  String container="cf-saneamento-"+UUID.randomUUID(),jar=System.getProperty("preparation.jar");
  String jdbc=Cf017PostgresSupport.schemaJdbcUrl(schema)+"&connectTimeout=2&socketTimeout=2";
  if(image)jdbc=jdbc.replace("//localhost:","//host.docker.internal:");
  Map<String,String> config=new HashMap<>(Map.of("SPRING_DATASOURCE_URL",jdbc,"SPRING_DATASOURCE_USERNAME",Cf017PostgresSupport.username(),"SPRING_DATASOURCE_PASSWORD",Cf017PostgresSupport.password(),
   "JWT_SECRET","synthetic-adoption-secret-at-least-32-chars","BRAPI_TOKEN","synthetic-unused","RESEND_API_KEY","synthetic-unused","EMAIL_RESEND","no-reply@example.test","FRONT_URL","http://localhost"));
  List<String> cmd=new ArrayList<>();
  if(image){cmd.addAll(List.of("docker","run","--rm","--name",container,"--label","cf.saneamento.adoption=true","-p","127.0.0.1::8080","-v",root.resolve("agent").toAbsolutePath()+":/diagnostic","--entrypoint","java"));config.forEach((k,v)->cmd.addAll(List.of("--env",k+"="+v)));cmd.add(System.getProperty("preparation.image"));}
  else cmd.addAll(List.of(Path.of(System.getProperty("java.home"),"bin","java").toString(),"-Xmx384m"));
  cmd.add(image?"-javaagent:/diagnostic/boot-agent.jar":"-javaagent:"+root.resolve("agent/boot-agent.jar"));
  cmd.add("-XX:StartFlightRecording=settings=profile,dumponexit=true,filename="+(image?"/diagnostic/image.jfr":root.resolve("native.jfr")));
  cmd.addAll(List.of("-jar",image?"/app/api.jar":jar,"--spring.profiles.active=adoption","--server.port="+(image?8080:0),"--app.operations.writers-enabled=true","--app.operations.jobs-enabled=false"));
  Path log=folder.resolve("process.log");var builder=new ProcessBuilder(cmd).redirectErrorStream(true).redirectOutput(log.toFile());
  builder.environment().keySet().removeIf(k->k.startsWith("SPRING_")||k.startsWith("DB_")||k.startsWith("FLYWAY_")||Set.of("JAVA_TOOL_OPTIONS","JDK_JAVA_OPTIONS","_JAVA_OPTIONS").contains(k));builder.environment().putAll(config);
  long start=System.nanoTime();Instant wall=Instant.now();Process process=builder.start();
  List<Map<String,Object>> events=new ArrayList<>();long readyMs=-1;int port=0;boolean forty=false;long nextSample=0;
  try {
   while(process.isAlive()&&ms(start)<90000&&readyMs<0) {
    long elapsed=ms(start);
    if(elapsed>=nextSample){events.add(Map.of("event","resource-sample","ms",elapsed,"processCpuMs",process.info().totalCpuDuration().orElse(Duration.ZERO).toMillis(),"availableProcessors",Runtime.getRuntime().availableProcessors()));nextSample=elapsed+5000;}
    if(port==0&&Files.readString(log).contains("Tomcat started on port")) {
     if(image){var p=new ProcessBuilder("docker","port",container,"8080/tcp").redirectErrorStream(true).start();assertThat(p.waitFor(5,TimeUnit.SECONDS)).isTrue();assertThat(p.exitValue()).isZero();String address=new String(p.getInputStream().readAllBytes()).trim();port=Integer.parseInt(address.substring(address.lastIndexOf(':')+1));}
     else{var m=java.util.regex.Pattern.compile("Tomcat started on port (\\d+)").matcher(Files.readString(log));if(m.find())port=Integer.parseInt(m.group(1));}
     events.add(Map.of("event","bound-port-discovered","ms",ms(start),"port",port));
    }
    if(port>0&&status(port,"readiness")==200){readyMs=ms(start);events.add(Map.of("event","first-readiness-200","ms",readyMs,"liveness",status(port,"liveness")));}
    if(ms(start)>=40000&&!forty){forty=true;events.add(Map.of("event","original-budget-exceeded","ms",ms(start)));}
    if(readyMs<0)Thread.sleep(100);
   }
   events.add(Map.of("event","diagnostic-ended","ms",ms(start),"alive",process.isAlive()));
   if(readyMs>=0){Cf017PostgresSupport.pauseServer();try{long t=System.nanoTime();int r=status(port,"readiness"),l=status(port,"liveness");events.add(Map.of("event","db-paused","readiness",r,"liveness",l,"probeMs",ms(t)));assertThat(r).isEqualTo(503);assertThat(l).isEqualTo(200);}finally{Cf017PostgresSupport.resumeServer();}assertThat(status(port,"readiness")).isEqualTo(200);}
  }finally {
   if(image){var stop=new ProcessBuilder("docker","stop","--time","10",container).redirectOutput(ProcessBuilder.Redirect.DISCARD).redirectErrorStream(true).start();assertThat(stop.waitFor(20,TimeUnit.SECONDS)).isTrue();}
   process.destroy();if(!process.waitFor(10,TimeUnit.SECONDS)){process.destroyForcibly();process.waitFor(5,TimeUnit.SECONDS);}
   results.add(Map.of("mode",mode,"wallStartUtc",wall.toString(),"events",events,"readyMs",readyMs,"originalBudgetMs",40000,"diagnosticBudgetMs",90000,"budgetPassed",readyMs>=0&&readyMs<=40000,"configuration","adoption; writers=true; jobs=false; JDBC connect/socket2s; JFR profile + external agent; dynamic host port","commandSanitized",cmd.stream().map(v->v.startsWith("SPRING_DATASOURCE_")?"SPRING_DATASOURCE_[synthetic-redacted]":v).toList()));
  }
 }
 int status(int port,String probe){try{return http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/ops/health/"+probe)).timeout(Duration.ofSeconds(8)).GET().build(),HttpResponse.BodyHandlers.discarding()).statusCode();}catch(Exception e){return -1;}}
 static long ms(long start){return TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);}
}
