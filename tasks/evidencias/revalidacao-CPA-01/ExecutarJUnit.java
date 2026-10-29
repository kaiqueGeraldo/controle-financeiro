import java.nio.file.*;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.launcher.core.*;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.jupiter.engine.JupiterTestEngine;

/** Independent directed Linux launcher. XML is a bridge from actual JUnit
 * summaries, not a claim of Maven/Surefire or Actions execution. */
public class ExecutarJUnit {
    public static void main(String[] args) throws Exception {
        if (!System.getProperty("os.name").equals("Linux")) throw new AssertionError("Real Linux JVM required");
        Path output=Path.of(args[0]); Files.createDirectory(output);
        for(int i=1;i<args.length;i++) {
            var summary=new SummaryGeneratingListener();
            var request=LauncherDiscoveryRequestBuilder.request()
                    .selectors(DiscoverySelectors.selectClass(args[i])).build();
            var config=LauncherConfig.builder().enableTestEngineAutoRegistration(false)
                    .addTestEngines(new JupiterTestEngine()).build();
            LauncherFactory.create(config).execute(request,summary);
            var result=summary.getSummary();
            if(result.getContainersFailedCount()!=0) throw new AssertionError("JUnit container failed");
            long skipped=result.getTestsSkippedCount()+result.getTestsAbortedCount();
            Files.writeString(output.resolve("TEST-"+args[i]+".xml"),
                    "<testsuite name=\""+args[i]+"\" tests=\""+result.getTestsFoundCount()
                    +"\" failures=\""+result.getTestsFailedCount()+"\" errors=\"0\" skipped=\""+skipped+"\"/>\n");
            System.out.println("class="+args[i]+"; os="+System.getProperty("os.name")
                    +"; java="+System.getProperty("java.version")+"; found="+result.getTestsFoundCount()
                    +"; skipped="+skipped+"; passed="+result.getTestsSucceededCount()
                    +"; failed="+result.getTestsFailedCount());
            for(var failure:result.getFailures())failure.getException().printStackTrace();
        }
    }
}
