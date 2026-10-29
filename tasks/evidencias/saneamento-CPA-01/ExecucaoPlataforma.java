import java.nio.file.*;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.launcher.core.*;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.jupiter.engine.JupiterTestEngine;

/** Directed REAL Linux JVM execution; summary XML bridge, not Maven/Surefire. */
public class ExecucaoPlataforma {
    public static void main(String[] args) throws Exception {
        if (!System.getProperty("os.name").equals("Linux")) throw new AssertionError("Real Linux required");
        Path reports=Path.of(args[0]); Files.createDirectory(reports);
        boolean legacy=args[1].equals("legacy");
        long found=0,skipped=0,failed=0,passed=0;
        for (int i=2;i<args.length;i++) {
            var listener=new SummaryGeneratingListener();
            var request=LauncherDiscoveryRequestBuilder.request().selectors(DiscoverySelectors.selectClass(args[i])).build();
            var config=LauncherConfig.builder().enableTestEngineAutoRegistration(false).addTestEngines(new JupiterTestEngine()).build();
            LauncherFactory.create(config).execute(request,listener);
            var result=listener.getSummary();
            found+=result.getTestsFoundCount();skipped+=result.getTestsSkippedCount();
            failed+=result.getTestsFailedCount();passed+=result.getTestsSucceededCount();
            if(result.getContainersFailedCount()!=0)throw new AssertionError("Container failure");
            Files.writeString(reports.resolve("TEST-"+args[i]+".xml"),"<testsuite tests=\""+result.getTestsFoundCount()+"\" failures=\""+result.getTestsFailedCount()+"\" errors=\"0\" skipped=\""+result.getTestsSkippedCount()+"\"/>\n");
            for(var failure:result.getFailures())failure.getException().printStackTrace();
        }
        if(found!=(legacy?4:3)||skipped!=(legacy?1:0)||failed!=0||passed!=3)throw new AssertionError("Unexpected directed execution counts");
        System.out.println("os.name="+System.getProperty("os.name")+"; java.version="+System.getProperty("java.version")+"; legacy="+legacy+"; found="+found+"; skipped="+skipped+"; passed="+passed);
    }
}
