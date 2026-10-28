package com.controlefinanceiro.api.migration;

import org.junit.jupiter.api.Test;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;
import java.nio.file.Files;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;

/** Independent HTTP/process boundary probes; copied only to the disposable checkout. */
class PortLifecycleProbeTest {
 static TcpNativeDiagnosticTest.Observer observer;
 static java.util.Map<String,Object> trace;
 static long closeBegin,closeEnd,bindBegin,bindEnd;
 @Test void ownedListenerEndsWhileUnrelatedReadyServiceSurvives() throws Exception {
  observer=new TcpNativeDiagnosticTest.Observer();trace=TcpNativeDiagnosticTest.event("original-window");
  var hits=new AtomicInteger();var alien=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  alien.createContext("/",exchange->{hits.incrementAndGet();byte[] body="UNRELATED".getBytes();exchange.sendResponseHeaders(200,body.length);try(var out=exchange.getResponseBody()){out.write(body);}});alien.start();
  int alienPort=alien.getAddress().getPort(),ownedPort;Process owned;String container;
  try {
   String schema=Cf017PostgresSupport.createSchema("rv_port_lifecycle");Cf017PostgresSupport.flyway(schema).migrate();
   try(var app=new AdoptionRuntimeTest.App(schema,true,false)) {
    app.awaitStatus("/ops/health/readiness",200);ownedPort=app.port;owned=app.process;container=app.containerName;
    assertThat(app.port).isPositive().isNotEqualTo(alienPort);assertThat(owned.isAlive()).isTrue();
    assertThat(app.call("GET","/ops/health/readiness",null,null).body()).isEqualTo("{\"status\":\"UP\"}");
    assertThat(hits.get()).isZero();assertThat(Files.readString(app.log)).contains("Tomcat started on port ");
    if(container!=null)assertThat(command("docker","inspect","--format","{{.Image}}",container)).isEqualTo(System.getProperty("preparation.image"));
    System.out.println("INDEPENDENT_BOUND_LISTENER port="+ownedPort+" pid="+owned.pid()+" container="+container);
    trace.put("pid",owned.pid());trace.put("birth",owned.info().startInstant().orElseThrow().toString());trace.put("port",ownedPort);trace.put("before",observer.snapshot(ownedPort));closeBegin=System.nanoTime();
   }
   closeEnd=System.nanoTime();
   assertThat(owned.isAlive()).isFalse();
   if(container!=null)assertThat(command("docker","ps","-a","--filter","name=^/"+container+"$","--format","{{.ID}}")).isEmpty();
   try(var replacement=new ServerSocket()) {replacement.setReuseAddress(true);bindBegin=System.nanoTime();replacement.bind(new InetSocketAddress("127.0.0.1",ownedPort));bindEnd=System.nanoTime();assertThat(replacement.getLocalPort()).isEqualTo(ownedPort);var state=observer.snapshot(ownedPort);trace.put("replacement",state);TcpNativeDiagnosticTest.assertListener(state,ownedPort,ProcessHandle.current().pid());}
   try(var closedClient=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build()){try{closedClient.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+ownedPort+"/ops/health/readiness")).timeout(Duration.ofSeconds(1)).build(),HttpResponse.BodyHandlers.ofString());throw new AssertionError("Old port still answers HTTP");}catch(java.io.IOException refused){trace.put("oldPortHttp",refused.getClass().getName());}}
   try(var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build()) {assertThat(client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+alienPort+"/ops/health/readiness")).timeout(Duration.ofSeconds(2)).build(),HttpResponse.BodyHandlers.ofString()).body()).isEqualTo("UNRELATED");}
   assertThat(hits.get()).isEqualTo(1);System.out.println("INDEPENDENT_CLEANUP completed=true portReused=true unrelatedPreserved=true");
  }catch(Exception failure){trace.put("errorType",failure.getClass().getName());trace.put("error",failure.getMessage());throw failure;}finally{trace.put("closeBegin",closeBegin);trace.put("closeEnd",closeEnd);trace.put("bindBegin",bindBegin);trace.put("bindEnd",bindEnd);trace.put("after",observer.snapshot((int)trace.getOrDefault("port",0)));TcpNativeDiagnosticTest.save("corrigido-window-pg17.json",trace);observer.close();alien.stop(0);}
 }
 @Test void occupiedExplicitPortDoesNotAcceptUnrelatedReadiness() throws Exception {
  assertThat(System.getProperty("preparation.image")).as("Native occupied-port probe; select explicitly").isNull();
  var hits=new AtomicInteger();var alien=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  alien.createContext("/",exchange->{hits.incrementAndGet();exchange.sendResponseHeaders(200,-1);exchange.close();});alien.start();
  try {
   String schema=Cf017PostgresSupport.createSchema("rv_occupied_port");Cf017PostgresSupport.flyway(schema).migrate();
   try(var app=new AdoptionRuntimeTest.App(schema,true,false,List.of("--server.port="+alien.getAddress().getPort()),Map.of())) {
    assertThatThrownBy(()->app.awaitStatus("/ops/health/readiness",200)).isInstanceOf(AssertionError.class).hasMessageContaining("was already in use");
    assertThat(app.process.waitFor(5,TimeUnit.SECONDS)).isTrue();assertThat(app.process.exitValue()).isNotZero();assertThat(hits.get()).isZero();
   }
   try(var client=HttpClient.newHttpClient()){assertThat(client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+alien.getAddress().getPort())).timeout(Duration.ofSeconds(2)).build(),HttpResponse.BodyHandlers.discarding()).statusCode()).isEqualTo(200);}
   assertThat(hits.get()).isEqualTo(1);System.out.println("INDEPENDENT_OCCUPIED_PORT foreignReadyNotAccepted=true foreignServicePreserved=true");
  }finally{alien.stop(0);}
 }
 private static String command(String... command)throws Exception {var process=new ProcessBuilder(command).redirectErrorStream(true).start();assertThat(process.waitFor(5,TimeUnit.SECONDS)).isTrue();assertThat(process.exitValue()).isZero();return new String(process.getInputStream().readAllBytes()).trim();}
}
