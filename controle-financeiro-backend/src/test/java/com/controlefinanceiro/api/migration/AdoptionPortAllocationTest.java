package com.controlefinanceiro.api.migration;
import org.junit.jupiter.api.Test;
import java.net.ServerSocket;
import static org.assertj.core.api.Assertions.assertThat;

class AdoptionPortAllocationTest {
    @Test void unrelatedListenerCannotStealApplicationPortBeforeTomcatBinds() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("port_allocation");
        Cf017PostgresSupport.flyway(schema).migrate();
        try(var app=new AdoptionRuntimeTest.App(schema,true,false);
            // Old allocator exposed a released port here. Binding it caused the
            // real application to fail with "Port ... was already in use".
            var unrelated=new ServerSocket(app.port)) {
            app.awaitStatus("/ops/health/readiness",200);
            assertThat(app.port).isNotEqualTo(unrelated.getLocalPort());
            assertThat(app.call("GET","/ops/health/liveness",null,null).statusCode()).isEqualTo(200);
            System.out.println("PORT_ALLOCATION_BOUND_BY_SERVER=true unrelatedListenerAlive=true");
        }
    }
}
