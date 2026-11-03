import com.controlefinanceiro.api.support.DisposablePostgresGuard;
import java.net.*;
import java.io.*;
import java.sql.*;
import java.util.*;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.utility.ResourceReaper;
import org.testcontainers.postgresql.PostgreSQLContainer;

public class InfraProbe {
  public static void main(String[] args) throws Exception {
    String host=args[0],run=args[2]; int port=Integer.parseInt(args[1]);
    String stage="C";
    PostgreSQLContainer pg=null;
    try {
      try(var s=new Socket()) {
        s.connect(new InetSocketAddress(host,port),3000);s.setSoTimeout(3000);
        String received=new String(s.getInputStream().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
        if(!received.equals(run))throw new IllegalStateException("Wrong disposable endpoint");
      }
      System.out.println("STEP C PASS host="+host+" port="+port+" tokenMatches=true");
      stage="D";
      System.out.println("SESSION "+DockerClientFactory.SESSION_ID);
      var client=DockerClientFactory.instance().client();
      System.out.println("DAEMON "+client.infoCmd().exec().getId());
      ResourceReaper.instance().init();
      for(var c:client.listContainersCmd().withLabelFilter(Map.of("org.testcontainers.sessionId",DockerClientFactory.SESSION_ID)).exec()) {
        var i=client.inspectContainerCmd(c.getId()).exec();
        System.out.println("TC_RESOURCE id="+c.getId()+" image="+c.getImage()+" privileged="+i.getHostConfig().getPrivileged()+" ports="+i.getNetworkSettings().getPorts());
      }
      System.out.println("STEP D PASS Ryuk initialized and handshake active");
      stage="E";
      String db="cf_test_"+run.replaceAll("[^a-zA-Z0-9]","");
      pg=new PostgreSQLContainer("postgres:16-alpine").withDatabaseName(db).withUsername("cf_test").withPassword("cf_test").withLabel("cf.review",run).withReuse(false);
      pg.start();
      System.out.println("PG id="+pg.getContainerId()+" host="+pg.getHost()+" port="+pg.getMappedPort(5432)+" database="+db);
      System.out.println("STEP E PASS disposable PostgreSQL started");
      stage="F";
      DisposablePostgresGuard.requireDisposable(pg.getJdbcUrl(),db);
      // Directed negative controls retain the unmodified safety boundary.
      for(String refused:List.of("jdbc:postgresql://host.docker.internal:5432/"+db,"jdbc:postgresql://127.0.0.1:5432/financas_db")) {
        boolean rejected=false;try{DisposablePostgresGuard.requireDisposable(refused,db);}catch(IllegalStateException expected){rejected=true;}
        if(!rejected)throw new IllegalStateException("Guard negative control survived");
      }
      System.out.println("STEP F PASS original guard and external/wrong-name negatives");
      stage="G";
      try(var c=DriverManager.getConnection(pg.getJdbcUrl(),pg.getUsername(),pg.getPassword());var st=c.createStatement();var rs=st.executeQuery("select current_database(), 1+1")) {
        if(!rs.next()||!db.equals(rs.getString(1))||rs.getInt(2)!=2)throw new IllegalStateException("Synthetic query mismatch");
      }
      System.out.println("STEP G PASS JDBC current_database and 1+1=2");
    } catch(Throwable e) {
      System.out.println("STEP "+stage+" FAIL "+e.getClass().getName()+": "+e.getMessage());
      e.printStackTrace();throw e;
    } finally {
      if(pg!=null) { pg.stop();System.out.println("PG_STOP requested=true"); }
    }
  }
}
