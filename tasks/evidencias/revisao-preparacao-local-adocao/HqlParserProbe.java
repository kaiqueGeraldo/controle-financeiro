import java.util.*;
import java.util.jar.JarFile;
import java.lang.reflect.*;
import java.lang.management.ManagementFactory;
import java.security.MessageDigest;
import org.springframework.data.jpa.repository.Query;

/** Parses the packaged @Query strings with the same SD JPA HQL parser; no DB/Spring context. */
public class HqlParserProbe {
    record Candidate(String method,String kind,String query) {}
    public static void main(String[] args) throws Exception {
        var parser=Class.forName("org.springframework.data.jpa.repository.query.JpaQueryEnhancer")
                .getDeclaredMethod("forHql",String.class);
        parser.setAccessible(true);
        var candidates=new ArrayList<Candidate>();
        try(var jar=new JarFile(args[0])) {
            var entries=jar.stream().map(e->e.getName()).filter(n->n.startsWith("BOOT-INF/classes/com/controlefinanceiro/api/")
                    &&n.endsWith("Repository.class")).sorted().toList();
            for(var entry:entries) {
                var type=Class.forName(entry.substring("BOOT-INF/classes/".length(),entry.length()-6).replace('/','.'),false,HqlParserProbe.class.getClassLoader());
                for(var method:type.getDeclaredMethods()) {
                    var query=method.getAnnotation(Query.class);
                    if(query==null||query.nativeQuery())continue;
                    candidates.add(new Candidate(type.getName()+"#"+method.getName(),"value",query.value()));
                    if(!query.countQuery().isBlank())candidates.add(new Candidate(type.getName()+"#"+method.getName(),"count",query.countQuery()));
                }
            }
        }
        candidates.sort(Comparator.comparing(Candidate::method).thenComparing(Candidate::kind));
        if(args.length>1)candidates.removeIf(c->!c.method().equals(args[1]));
        var mapper=new com.fasterxml.jackson.databind.ObjectMapper();
        var cpu=ManagementFactory.getThreadMXBean();
        for(var c:candidates) {
            String digest=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(c.query().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            System.out.println(mapper.writeValueAsString(Map.of("event","begin","method",c.method(),"kind",c.kind(),"chars",c.query().length(),"sha256",digest)));
            long start=System.nanoTime(),cpuStart=cpu.getCurrentThreadCpuTime();
            String error="";
            try{parser.invoke(null,c.query());}catch(InvocationTargetException e){error=e.getCause().getClass().getName();}
            System.out.println(mapper.writeValueAsString(Map.of("event","end","method",c.method(),"kind",c.kind(),
                    "elapsedMs",(System.nanoTime()-start)/1e6,"cpuMs",(cpu.getCurrentThreadCpuTime()-cpuStart)/1e6,"error",error)));
        }
    }
}
