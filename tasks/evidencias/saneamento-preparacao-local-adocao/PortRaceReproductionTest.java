package com.controlefinanceiro.api.migration;
import org.junit.jupiter.api.Test;
import java.net.ServerSocket;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;
/** Original App source is unmodified. Deterministically occupy its released port. */
class PortRaceReproductionTest {
 @Test void releasedReservationAllowsPortToBeStolenBeforeTomcatBinds() throws Exception {
  String schema=Cf017PostgresSupport.createSchema("port_race");Cf017PostgresSupport.flyway(schema).migrate();
  Class<?> type=Class.forName("com.controlefinanceiro.api.migration.AdoptionRuntimeTest$App");
  var ctor=type.getDeclaredConstructor(String.class,boolean.class,boolean.class);ctor.setAccessible(true);
  try(var app=(AutoCloseable)ctor.newInstance(schema,true,false)) {
   var portField=type.getDeclaredField("port");portField.setAccessible(true);int port=portField.getInt(app);
   try(var blocker=new ServerSocket(port)) {
    var pf=type.getDeclaredField("process");pf.setAccessible(true);Process process=(Process)pf.get(app);
    assertThat(process.waitFor(40,TimeUnit.SECONDS)).isTrue();assertThat(process.exitValue()).isNotZero();
    var lf=type.getDeclaredField("log");lf.setAccessible(true);String log=Files.readString((Path)lf.get(app));
    assertThat(log).contains("Port "+port+" was already in use");
    System.out.println("PORT_RACE_REPRODUCED originalReservationReleased=true failureBefore40s=true");
   }
  }
 }
}
