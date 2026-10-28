package com.controlefinanceiro.api.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.io.*;
import java.net.*;
import java.nio.channels.ServerSocketChannel;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.*;

/** Diagnostics preserve failures as data; they do not certify the original rebind oracle. */
class TcpNativeDiagnosticTest {
    static final ObjectMapper JSON = new ObjectMapper();
    static Path root() { return Path.of(System.getProperty("tcp.runtime")); }
    static Map<String,Object> event(String name) {
        var row=new LinkedHashMap<String,Object>(); row.put("event",name); row.put("utc",Instant.now().toString()); row.put("nanoTime",System.nanoTime()); return row;
    }
    static void save(String file,Object result)throws Exception {
        Files.writeString(root().resolve(file),JSON.writerWithDefaultPrettyPrinter().writeValueAsString(result)+"\n",StandardOpenOption.CREATE_NEW);
    }
    static class Observer implements AutoCloseable {
        final Process process; final BufferedReader output; final PrintWriter input;
        Observer() throws Exception {
            process=new ProcessBuilder("powershell.exe","-NoProfile","-NonInteractive","-File",System.getProperty("tcp.observer"))
                    .redirectError(root().resolve("observer-"+UUID.randomUUID()+".err").toFile()).start();
            output=process.inputReader();input=new PrintWriter(process.getOutputStream(),true);
            assertThat(output.readLine()).isEqualTo("READY");
        }
        JsonNode snapshot(int port)throws Exception {
            input.println(port); var row=JSON.readTree(output.readLine()); assertThat(row.has("error")).as(row.toString()).isFalse(); return row;
        }
        public void close()throws Exception { input.close(); if(!process.waitFor(5,TimeUnit.SECONDS)){process.destroyForcibly();throw new AssertionError("Observer did not end");} assertThat(process.exitValue()).isZero(); }
    }
    static Map<String,Object> bind(int port) {
        var result=event("replacement-bind");
        try(var socket=new ServerSocket()) {
            socket.setReuseAddress(true); result.put("reuseAddress",socket.getReuseAddress());
            socket.bind(new InetSocketAddress("127.0.0.1",port)); result.put("success",true);
        } catch(Exception ex) { result.put("success",false);result.put("type",ex.getClass().getName());result.put("message",ex.getMessage()); }
        result.put("endNanoTime",System.nanoTime());return result;
    }
    @Test void applicationBoundary()throws Exception {
        String major=System.getProperty("cf017.postgres.major");
        var timeline=new ArrayList<Map<String,Object>>();
        try(var observer=new Observer()) {
            String schema=Cf017PostgresSupport.createSchema("tcp_native");Cf017PostgresSupport.flyway(schema).migrate();
            var app=new AdoptionRuntimeTest.App(schema,true,false);
            int port=0;
            try {
                app.awaitStatus("/ops/health/readiness",200);port=app.port;
                assertThat(app.call("GET","/ops/health/readiness",null,null).body()).isEqualTo("{\"status\":\"UP\"}");
                var ready=event("ready");ready.put("pid",app.process.pid());ready.put("birth",app.process.info().startInstant().orElseThrow().toString());ready.put("parentPid",ProcessHandle.current().pid());
                ready.put("port",port);ready.put("log",app.log.toAbsolutePath().toString());ready.put("tcp",observer.snapshot(port));timeline.add(ready);
                assertThat(ready.get("tcp").toString()).contains("\"Pid\":"+app.process.pid());
                timeline.add(event("close-begin"));
                app.close();
                var closed=event("close-return");closed.put("alive",app.process.isAlive());closed.put("descendants",app.process.descendants().map(ProcessHandle::pid).toList());timeline.add(closed);
                // Same order as original: no socket query between close and bind.
                var rebound=bind(port);timeline.add(rebound);
                var after=event("after-bind");after.put("tcp",observer.snapshot(port));timeline.add(after);
                assertThat(app.process.isAlive()).isFalse();
            } finally {
                if(app.process.isAlive()) app.close();
                save("application-pg"+major+".json",timeline);
            }
        }
    }
    @Test void syntheticBoundedMatrix()throws Exception {
        var cases=new ArrayList<Map<String,Object>>();
        try(var observer=new Observer()) {
            for(String mode:List.of("none","open","client-first")) {
                for(String address:List.of("127.0.0.1","0.0.0.0")) {
                    var record=event("synthetic");record.put("mode",mode);record.put("address",address);
                    var child=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin","java").toString(),"-cp",System.getProperty("java.class.path"),Listener.class.getName(),address)
                            .redirectError(root().resolve("synthetic-"+mode+"-"+address+".err").toFile()).start();
                    Socket client=null;
                    try(var lines=child.inputReader();var commands=new PrintWriter(child.getOutputStream(),true)) {
                        int port=Integer.parseInt(lines.readLine());record.put("port",port);record.put("pid",child.pid());record.put("birth",child.info().startInstant().orElseThrow().toString());
                        if(!mode.equals("none")) {
                            client=new Socket("127.0.0.1",port);commands.println("accept");assertThat(lines.readLine()).isEqualTo("accepted");
                            if(mode.equals("client-first")){client.close();commands.println("drain");assertThat(lines.readLine()).isEqualTo("eof");}
                        }
                        record.put("before",observer.snapshot(port));record.put("closeBeginNanoTime",System.nanoTime());
                        commands.println("exit");assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();record.put("closeEndNanoTime",System.nanoTime());record.put("alive",child.isAlive());
                        record.put("bind",bind(port));record.put("after",observer.snapshot(port));
                        if(client!=null)client.close();
                        record.put("afterClientClose",observer.snapshot(port));
                    } finally { if(client!=null)client.close();if(child.isAlive()){child.destroyForcibly();assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();}cases.add(record);save("synthetic-"+mode+"-"+address+".json",record); }
                }
            }
        }
        save("synthetic-matrix.json",cases);
    }
    @Test void abruptTerminationPair()throws Exception {
        try(var observer=new Observer()) {
            for(String address:List.of("127.0.0.1","0.0.0.0")) {
                var record=event("abrupt");record.put("address",address);
                var child=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin","java").toString(),"-cp",System.getProperty("java.class.path"),Listener.class.getName(),address)
                        .redirectError(root().resolve("abrupt-"+address+".err").toFile()).start();
                try(var lines=child.inputReader();var commands=new PrintWriter(child.getOutputStream(),true)) {
                    int port=Integer.parseInt(lines.readLine());record.put("port",port);record.put("pid",child.pid());
                    try(var client=new Socket("127.0.0.1",port)) {
                        commands.println("accept");assertThat(lines.readLine()).isEqualTo("accepted");record.put("before",observer.snapshot(port));
                        long closeBegin=System.nanoTime();child.destroy();assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();long closeEnd=System.nanoTime();
                        // No enumeration/observation between waitFor and rebind.
                        var rebound=bind(port);record.put("closeBegin",closeBegin);record.put("closeEnd",closeEnd);record.put("bind",rebound);record.put("after",observer.snapshot(port));
                    }
                } finally { if(child.isAlive()){child.destroyForcibly();assertThat(child.waitFor(5,TimeUnit.SECONDS)).isTrue();}save("abrupt-"+address+".json",record); }
            }
        }
    }
    public static class Listener {
        public static void main(String[] args)throws Exception {
            try(var listener=ServerSocketChannel.open();var input=new BufferedReader(new InputStreamReader(System.in))) {
                listener.setOption(StandardSocketOptions.SO_REUSEADDR,true);
                listener.bind(new InetSocketAddress(args[0],0));
                System.out.println(((InetSocketAddress)listener.getLocalAddress()).getPort());System.out.flush();
                java.nio.channels.SocketChannel accepted=null;
                try {
                    for(String command;(command=input.readLine())!=null;) {
                        if(command.equals("accept")){accepted=listener.accept();System.out.println("accepted");System.out.flush();}
                        if(command.equals("drain")){assert accepted!=null;while(accepted.read(java.nio.ByteBuffer.allocate(16))!=-1){}accepted.close();System.out.println("eof");System.out.flush();}
                        if(command.equals("exit"))break;
                    }
                }finally { if(accepted!=null)accepted.close(); }
            }
        }
    }
}
