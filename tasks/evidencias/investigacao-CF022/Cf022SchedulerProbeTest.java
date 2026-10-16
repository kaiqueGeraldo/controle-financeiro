package com.controlefinanceiro.api.domain.habit;

import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import java.nio.file.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;

/** Executes the original assertions and 10-second bound unchanged in a disposable schema. */
class Cf022SchedulerProbeTest extends HabitIntegrityIntegrationTest {
    @Test void freshThenResidualFixtures() throws Exception {
        Path dir=Path.of(System.getProperty("cf022.evidence"));
        Files.createDirectories(dir);
        AtomicInteger calls=new AtomicInteger();
        MethodInterceptor observer=call->{
            if(call.getMethod().getName().equals("findForUpdate")) calls.incrementAndGet();
            return call.proceed();
        };
        ((Advised)habits).addAdvice(0,observer);
        try {
            runObserved("fresh",dir,calls);
            sql.update("""
              insert into habits(id,name,icon,color,current_streak,highest_streak,frequency,user_id)
              select md5(? || n)::uuid,'Residual synthetic','check','BLUE',0,0,'DAILY',?
              from generate_series(1,501) n
              """,user.getId().toString(),user.getId());
            sql.update("update shedlock set lock_until=(current_timestamp AT TIME ZONE 'UTC')-interval '1 second' where name='processDailyHabitsLock'");
            runObserved("residual501",dir,calls);
        } finally { ((Advised)habits).removeAdvice(observer); }
    }
    private void runObserved(String name,Path dir,AtomicInteger calls) throws Exception {
        calls.set(0);
        Path out=dir.resolve(name+"-observations.txt");
        var observer=Executors.newSingleThreadScheduledExecutor();
        Runnable snapshot=()->{
          try {
            String data="sample="+System.nanoTime()+" calls="+calls.get()+" inventory="+sql.queryForList("select count(*) habits,count(distinct user_id) owners from habits")
              +"\nactivity="+sql.queryForList("select pid,state,wait_event_type,wait_event,pg_blocking_pids(pid)::text blockers,left(query,400) query from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()")
              +"\nlocks="+sql.queryForList("select pid,locktype,mode,granted,relation::regclass::text relation from pg_locks where not granted")+"\n";
            if(dataSource instanceof com.zaxxer.hikari.HikariDataSource pool)data+="pool="+pool.getHikariPoolMXBean().getActiveConnections()+"/"+pool.getMaximumPoolSize()+" waiting="+pool.getHikariPoolMXBean().getThreadsAwaitingConnection()+"\n";
            Files.writeString(out,data,StandardOpenOption.CREATE,StandardOpenOption.APPEND);
          }catch(Exception ex){throw new RuntimeException(ex);}
        };
        snapshot.run();
        var sampling=observer.scheduleAtFixedRate(snapshot,0,250,TimeUnit.MILLISECONDS);
        long start=System.nanoTime();String result="PASS";
        try { independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock(); }
        catch(Exception|AssertionError ex){result=ex.toString();throw ex;}
        finally {
          sampling.cancel(false);observer.shutdown();assertThat(observer.awaitTermination(5,TimeUnit.SECONDS)).isTrue();
          snapshot.run();
          Files.writeString(dir.resolve(name+"-result.txt"),"result="+result+"\nelapsedMs="+(System.nanoTime()-start)/1_000_000+"\nfindForUpdateCalls="+calls.get()+"\nterminal="+sql.queryForList("select status,count(*) from habit_logs group by status")+"\n");
        }
    }
}
