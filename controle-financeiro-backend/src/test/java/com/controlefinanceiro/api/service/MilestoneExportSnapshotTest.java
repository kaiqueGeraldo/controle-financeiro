package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class MilestoneExportSnapshotTest extends PostgresIntegrationTest {
    @Autowired TransactionService service;
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired TransactionRepository ledger;
    @Autowired JdbcTemplate sql;

    @Test void H02_exportKeepsOneSnapshotWhenAnIndependentWriterCommitsBetweenPages() throws Exception {
        var day=LocalDate.of(2026,9,7);var u=new User();u.setNome("H02");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");users.save(u);
        var a=accounts.create(new CreateAccountDTO("Snapshot",AccountType.CHECKING,new BigDecimal("1000.00"),"BLUE",day),u).id();
        sql.update("""
            insert into transactions(id,description,amount,date,is_paid,type,account_id,user_id,is_system_managed,created_at,status,origin)
            select gen_random_uuid(),'Snapshot row '||n,1.00,cast(? as date),true,'INCOME',?,?,false,cast(? as timestamp),'SETTLED','USER'
            from generate_series(1,501) n
            """,day,a,u.getId(),day.atTime(9,0));
        sql.update("update accounts set balance=1501.00 where id=?",a);
        var read=new CountDownLatch(1);var release=new CountDownLatch(1);var exportThread=new AtomicReference<Thread>();var held=new AtomicBoolean();
        MethodInterceptor barrier=call->{
            Object result=call.proceed();
            if(call.getMethod().getName().equals("findFilteredByUserId") && Thread.currentThread()==exportThread.get() && held.compareAndSet(false,true)) {
                read.countDown();if(!release.await(15,TimeUnit.SECONDS))throw new IllegalStateException("H02 barrier timeout");
            }
            return result;
        };
        ((Advised)ledger).addAdvice(0,barrier);
        byte[] bytes;
        try(var pool=Executors.newFixedThreadPool(2)) {
            var export=pool.submit(()->{exportThread.set(Thread.currentThread());return service.exportToExcel(u,9,2026,null,null);});
            assertThat(read.await(15,TimeUnit.SECONDS)).as("first page materialized before concurrent commit").isTrue();
            var write=pool.submit(()->service.create(new CreateTransactionDTO("Concurrent after snapshot",new BigDecimal("10.00"),day,"10:00",TransactionType.INCOME,a,null,true),u));
            assertThat(write.get(15,TimeUnit.SECONDS).amount()).isEqualByComparingTo("10.00");
            assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("1511.00");
            release.countDown();bytes=export.get(20,TimeUnit.SECONDS);
        } finally {release.countDown();((Advised)ledger).removeAdvice(barrier);}
        try(var workbook=new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            var sheet=workbook.getSheetAt(0);List<String> names=new ArrayList<>();
            for(int i=8;i<=sheet.getLastRowNum();i++){var row=sheet.getRow(i);if(row.getCell(8).getStringCellValue().equals("USER"))names.add(row.getCell(2).getStringCellValue());}
            String observed="income="+new BigDecimal(sheet.getRow(2).getCell(2).getStringCellValue()).doubleValue()+", userRows="+names.size()+", unique="+new HashSet<>(names).size()+", concurrentIncluded="+names.contains("Concurrent after snapshot");
            System.out.println("H02 controlled export: "+observed);
            assertThat(new BigDecimal(sheet.getRow(2).getCell(2).getStringCellValue())).isEqualByComparingTo("501.00");
            assertThat(names).as(observed).hasSize(501).doesNotHaveDuplicates().doesNotContain("Concurrent after snapshot");
        }
        try(var workbook=new XSSFWorkbook(new ByteArrayInputStream(service.exportToExcel(u,9,2026,null,null)))) {
            assertThat(new BigDecimal(workbook.getSheetAt(0).getRow(2).getCell(2).getStringCellValue())).isEqualByComparingTo("511.00");
        }
    }
}
