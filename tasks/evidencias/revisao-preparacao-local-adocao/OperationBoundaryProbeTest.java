package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.operations.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.availability.*;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.*;
import com.zaxxer.hikari.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/** Independent narrow observations; does not replace original process startup tests. */
class OperationBoundaryProbeTest {
    @Test void closedIngressNeverReachesSqlOrExternalEffect() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("review_filter");
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()){s.execute("CREATE TABLE "+schema+".probe_effect(id integer)");}
        var request=new MockHttpServletRequest("POST","/accounts");request.setServletPath("/accounts");
        var response=new MockHttpServletResponse();var external=new AtomicInteger();
        new MaintenanceFilter(new OperationsState(false,false)).doFilter(request,response,(req,res)->{
            try(var c=Cf017PostgresSupport.connect();var s=c.createStatement()){s.execute("INSERT INTO "+schema+".probe_effect VALUES(1)");}
            catch(Exception e){throw new RuntimeException(e);}
            external.incrementAndGet();
        });
        long persisted;
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement();var r=s.executeQuery("SELECT count(*) FROM "+schema+".probe_effect")){r.next();persisted=r.getLong(1);}
        System.out.println("REVIEW_INGRESS status="+response.getStatus()+" sqlRows="+persisted+" externalEffects="+external.get());
        assertThat(response.getStatus()).isEqualTo(503);assertThat(persisted).isZero();assertThat(external.get()).isZero();
    }
    @Test void readyDatabaseProbeObservesRealUnavailableDependency() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("review_health");
        var config=new HikariConfig();config.setJdbcUrl(Cf017PostgresSupport.schemaJdbcUrl(schema)+"&connectTimeout=2&socketTimeout=2");
        config.setUsername(Cf017PostgresSupport.username());config.setPassword(Cf017PostgresSupport.password());
        config.setMaximumPoolSize(2);config.setMinimumIdle(1);config.setConnectionTimeout(3000);config.setValidationTimeout(1000);
        var availability=mock(ApplicationAvailability.class);
        when(availability.getReadinessState()).thenReturn(ReadinessState.ACCEPTING_TRAFFIC);
        when(availability.getLivenessState()).thenReturn(LivenessState.CORRECT);
        try(var db=new HikariDataSource(config)){
            var controller=new HealthController(availability,new OperationsState(true,false),db);
            assertThat(controller.readiness().getStatusCode().value()).isEqualTo(200);
            Cf017PostgresSupport.pauseServer();
            try{
                long start=System.nanoTime();int ready=controller.readiness().getStatusCode().value(),live=controller.liveness().getStatusCode().value();
                System.out.println("REVIEW_HEALTH dbPaused=true readiness="+ready+" liveness="+live+" ms="+(System.nanoTime()-start)/1000000);
                assertThat(ready).isEqualTo(503);assertThat(live).isEqualTo(200);
            }finally{Cf017PostgresSupport.resumeServer();}
        }
    }
    @Test void unsafeGuardStopsBeforeRegisteredMigrationEffect() throws Exception {
        String schema=Cf017PostgresSupport.createSchema("review_guard");
        boolean blocked=false;
        try(var context=new GenericApplicationContext()){
            var env=context.getEnvironment();env.setActiveProfiles("adoption");
            env.getPropertySources().addFirst(new MapPropertySource("review",Map.of(
                "spring.jpa.hibernate.ddl-auto","validate","spring.flyway.enabled","true",
                "spring.sql.init.mode","never","app.operations.writers-enabled","false","app.operations.jobs-enabled","false")));
            context.registerBean("migrationEffect",Object.class,()->Cf017PostgresSupport.flyway(schema).migrate());
            try{new AdoptionSafetyInitializer().initialize(context);context.refresh();}
            catch(IllegalStateException e){blocked=e.getMessage().contains("Unsafe adoption configuration: spring.flyway.enabled");if(!blocked)throw e;}
        }
        long versions=0;
        try(var c=Cf017PostgresSupport.connect();var s=c.createStatement();var r=s.executeQuery("SELECT count(*) FROM information_schema.tables WHERE table_schema='"+schema+"' AND table_name='flyway_schema_history'")){
            r.next();if(r.getLong(1)>0)try(var q=c.createStatement();var rows=q.executeQuery("SELECT count(*) FROM "+schema+".flyway_schema_history WHERE version IS NOT NULL")){rows.next();versions=rows.getLong(1);}
        }
        System.out.println("REVIEW_GUARD blocked="+blocked+" migratedVersions="+versions);
        assertThat(blocked).isTrue();assertThat(versions).isZero();
    }
}
