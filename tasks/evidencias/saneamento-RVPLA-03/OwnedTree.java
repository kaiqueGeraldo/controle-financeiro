import java.nio.file.*;import java.net.*;import java.time.*;import java.util.*;
/** Harmless fixture; no database, Spring or financial code. */
class OwnedTree {
 public static void main(String[] args)throws Exception {
  Path root=Path.of(args[0]);String mode=args[1];
  try(var socket=new ServerSocket(0,10,InetAddress.getLoopbackAddress())) {
   String json="{\"pid\":"+ProcessHandle.current().pid()+",\"parent\":"+ProcessHandle.current().parent().orElseThrow().pid()+",\"port\":"+socket.getLocalPort()+",\"started\":\""+ProcessHandle.current().info().startInstant().orElseThrow()+"\"}";
   Path temp=root.resolve(mode+".tmp");Files.writeString(temp,json);Files.move(temp,root.resolve(mode+".json"),StandardCopyOption.ATOMIC_MOVE);
   if(mode.equals("late"))Files.writeString(root.resolve("late-effect.txt"),"LATE_JAVA_EFFECT "+Instant.now());
   if(mode.equals("child"))new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin/java").toString(),"-cp",System.getProperty("java.class.path"),"OwnedTree",root.toString(),"descendant").inheritIO().start();
   long end=System.nanoTime()+Duration.ofSeconds(30).toNanos();
   while(!Files.exists(root.resolve("stop-java"))&&System.nanoTime()<end)Thread.sleep(25);
  }
 }
}
