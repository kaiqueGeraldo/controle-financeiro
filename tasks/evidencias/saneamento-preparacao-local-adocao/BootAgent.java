package diagnostic;
import java.lang.instrument.Instrumentation;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.asm.Advice;
import static net.bytebuddy.matcher.ElementMatchers.*;

/** Diagnostic only; loaded externally. Never ships in the application JAR. */
public class BootAgent {
 public static void premain(String args,Instrumentation instrumentation) {
  System.out.println("BOOT_AGENT|"+System.nanoTime()+"|"+System.currentTimeMillis());
  new AgentBuilder.Default().disableClassFormatChanges()
   .with(AgentBuilder.Listener.StreamWriting.toSystemError().withErrorsOnly())
   .type(named("org.springframework.data.jpa.repository.query.JpaQueryEnhancer"))
   .transform((b,t,c,m,p)->b.visit(Advice.to(Query.class).on(named("forHql").and(takesArgument(0,String.class)))))
   .type(named("org.hibernate.internal.AbstractSharedSessionContract"))
   .transform((b,t,c,m,p)->b.visit(Advice.to(Query.class).on(named("createQuery").and(takesArgument(0,String.class)))))
   .type(named("org.springframework.data.jpa.repository.query.SimpleJpaQuery"))
   .transform((b,t,c,m,p)->b.visit(Advice.to(Method.class).on(isConstructor())))
   .installOn(instrumentation);
 }
 public static String digest(String query) throws Exception {
  return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(query.getBytes(StandardCharsets.UTF_8)));
 }
 public static class Query {
  @Advice.OnMethodEnter public static long begin(@Advice.Argument(0)String query,@Advice.Origin("#t.#m")String origin)throws Exception {
   long now=System.nanoTime();System.out.println("BOOT_QUERY_BEGIN|"+now+"|"+origin+"|"+BootAgent.digest(query)+"|"+query.length());return now;
  }
  @Advice.OnMethodExit(onThrowable=Throwable.class)public static void end(@Advice.Enter long start,@Advice.Argument(0)String query,@Advice.Origin("#t.#m")String origin,@Advice.Thrown Throwable failure)throws Exception {
   long now=System.nanoTime();System.out.println("BOOT_QUERY_END|"+now+"|"+origin+"|"+BootAgent.digest(query)+"|"+(now-start)+"|"+(failure==null?"OK":failure.getClass().getName()));
  }
 }
 public static class Method {
  @Advice.OnMethodEnter public static void begin(@Advice.Argument(0)Object method) {
   System.out.println("BOOT_METHOD|"+System.nanoTime()+"|"+method);
  }
 }
}
