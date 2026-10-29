package com.controlefinanceiro.api.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledOnOs;
import org.junit.jupiter.api.condition.OS;
import java.net.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.*;

/** Independent postcondition/budget probes; source override is confined to the disposable helper copy. */
class ReviewNativeSocketsTest {
 static final List<Map<String,Object>> events=new ArrayList<>();
 static String label;
 static void mark(String phase,Object value){var row=new LinkedHashMap<String,Object>();row.put("case",label);row.put("phase",phase);row.put("ns",System.nanoTime());row.put("utc",Instant.now().toString());row.put("value",value);events.add(row);}
 static ServerSocket listener(String address,int port)throws Exception{var s=new ServerSocket();s.setReuseAddress(true);s.bind(new InetSocketAddress(address,port));return s;}
 static void call(long pid,int port,long budgetMs,boolean expected)throws Exception {
  long begin=System.nanoTime(),deadline=begin+TimeUnit.MILLISECONDS.toNanos(budgetMs);mark("call",Map.of("pid",pid,"port",port,"budgetMs",budgetMs,"deadline",deadline));
  Exception error=null;try{AdoptionNativeSockets.awaitReleased(pid,port,deadline);}catch(Exception ex){error=ex;}
  long end=System.nanoTime();mark("return",Map.of("released",error==null,"elapsedMs",(end-begin)/1_000_000.0,"error",error==null?"":error.getClass().getName()+": "+error.getMessage()));
  assertThat(error==null).as(label).isEqualTo(expected);if(expected)assertThat(end).isLessThan(deadline);else assertThat(end-begin).isLessThan(TimeUnit.MILLISECONDS.toNanos(budgetMs+2500));
 }
 @EnabledOnOs(OS.WINDOWS) @Test void boundedIndependentCases()throws Exception{
  long pid=ProcessHandle.current().pid();int port;
  try(var observer=new TcpNativeDiagnosticTest.Observer()){
   label="free-same-port";try(var s=listener("127.0.0.1",0)){port=s.getLocalPort();}mark("before",observer.snapshot(port));call(pid,port,10000,true);try(var replacement=listener("127.0.0.1",port)){assertThat(replacement.getLocalPort()).isEqualTo(port);mark("single-bind",observer.snapshot(port));}
   label="replacement-other-process";
   var child=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin/java").toString(),"-cp",System.getProperty("java.class.path"),TcpNativeDiagnosticTest.Listener.class.getName(),"127.0.0.1").redirectError(ProcessBuilder.Redirect.DISCARD).start();
   try(var lines=child.inputReader();var commands=new java.io.PrintWriter(child.getOutputStream(),true)){
    int p=Integer.parseInt(lines.readLine());mark("original",Map.of("pid",child.pid(),"birth",child.info().startInstant().orElseThrow().toString(),"port",p));commands.println("exit");assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();call(child.pid(),p,10000,true);
    try(var foreign=listener("127.0.0.1",p)){
     var state=observer.snapshot(p);TcpNativeDiagnosticTest.assertListener(state,p,pid);mark("replacement",state);call(child.pid(),p,10000,true);
     try(var collision=new ServerSocket()){collision.setReuseAddress(true);assertThatThrownBy(()->collision.bind(new InetSocketAddress("127.0.0.1",p))).isInstanceOf(BindException.class);}
     try(var client=new Socket("127.0.0.1",p);var accepted=foreign.accept()){assertThat(accepted.isConnected()).isTrue();}assertThat(foreign.isClosed()).isFalse();mark("foreign-preserved",true);
    }
   }finally{if(child.isAlive()){child.destroyForcibly();assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();}}
   label="ipv6-other-family-conservative";try(var s=listener("::1",0)){int p=s.getLocalPort();mark("before",observer.snapshot(p));call(pid,p,4000,false);assertThat(s.isClosed()).isFalse();}
   label="established-without-listen-conservative";try(var s=listener("127.0.0.1",0);var client=new Socket("127.0.0.1",s.getLocalPort());var accepted=s.accept()){
    int p=s.getLocalPort();s.close();var state=observer.snapshot(p);for(var row:state.path("rows"))if(row.path("LocalPort").asInt()==p)assertThat(row.path("State").asInt()).isNotEqualTo(2);mark("without-listen",state);call(pid,p,4000,false);assertThat(accepted.isClosed()).isFalse();
   }
   var faults=new LinkedHashMap<String,String>();faults.put("missing-confirmation","@{ownedRows=0}|ConvertTo-Json -Compress");faults.put("negative-count","@{inspected=$true;ownedRows=-1}|ConvertTo-Json -Compress");faults.put("partial-json","[Console]::Out.WriteLine('{')");faults.put("inspection-error","throw 'review controlled identity/table inspection failure'");faults.put("retained-condition","@{inspected=$true;ownedRows=1}|ConvertTo-Json -Compress");faults.put("slow-inspector","Start-Sleep -Seconds 20;@{inspected=$true;ownedRows=0}|ConvertTo-Json -Compress");
   for(var fault:faults.entrySet()){label=fault.getKey();System.setProperty("tcp.review.query",fault.getValue());try{call(pid,port,label.equals("slow-inspector")?500:1800,false);}finally{System.clearProperty("tcp.review.query");}}
   for(var row:events)if(row.get("phase").equals("inspector-ended")||row.get("phase").equals("inspector-cleaned"))assertThat(((Map<?,?>)row.get("value")).get("alive")).isEqualTo(false);
  }finally{System.clearProperty("tcp.review.query");Files.writeString(Path.of(System.getProperty("tcp.runtime"),"review-cases.json"),new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(events)+"\n",StandardOpenOption.CREATE_NEW);}
 }
}
