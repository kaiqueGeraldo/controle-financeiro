package com.controlefinanceiro.api.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import java.sql.*;
import static org.assertj.core.api.Assertions.*;

/** Directed V2/V3/V4 upgrades; no adoption gate or production baseline. */
class IncrementalMilestoneReviewTest {
    @Test void canonicalV2ThenV3V4V5() throws Exception {upgrade(2);}
    @Test void canonicalV3ThenV4V5() throws Exception {upgrade(3);}
    @Test void canonicalV4ThenV5() throws Exception {upgrade(4);}

    @Test void canonicalV5ThenV6() throws Exception {upgrade(5);}
    @Test void canonicalV6ThenV7() throws Exception {upgrade(6);}
    @Test void canonicalV7ThenV8() throws Exception {upgrade(7);}
    private void upgrade(int start) throws Exception {
        String schema=Cf017PostgresSupport.createSchema("rv1821_v"+start);
        Flyway limited=Flyway.configure().configuration(Cf017PostgresSupport.flyway(schema).getConfiguration()).target(String.valueOf(start)).load();
        assertThat(limited.migrate().migrationsExecuted).isEqualTo(start);
        try(Connection c=Cf017PostgresSupport.connect();Statement s=c.createStatement()){
            s.execute("set search_path to "+schema);
            s.execute("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values ('10000000-0000-0000-0000-000000000001','Review','review@example.invalid','synthetic',true,false)");
            s.execute("insert into accounts(id,name,type,balance,is_archived,user_id,version) values ('20000000-0000-0000-0000-000000000001','Review','CHECKING',1000,false,'10000000-0000-0000-0000-000000000001',0)");
            String extra=start>=3?",status,origin":"";
            String values=start>=3?",'SETTLED','USER'":"";
            s.execute("insert into transactions(id,description,amount,date,is_paid,type,account_id,user_id,is_system_managed,created_at,operation_time,time_origin,recorded_at,legacy_created_at_raw"+extra+") values ('40000000-0000-0000-0000-000000000001','Canonical between migrations',12.34,'2026-09-07',true,'INCOME','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',false,'2026-09-07 23:30:45.123456','08:15:00','USER_INPUT','2026-09-08 02:00:00.123456+00','2026-09-07 23:30:45.123456'"+values+")");
            // Unknown row with null provenance must remain unknown; no text heuristic.
            s.execute("insert into transactions(id,description,amount,date,is_paid,type,account_id,user_id,is_system_managed,created_at"+(start>=3?",status":"")+") values ('40000000-0000-0000-0000-000000000002','Saldo Inicial',45.67,'2026-09-07',false,'EXPENSE','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',true,'2026-09-07 00:00:00'"+(start>=3?",'PENDING'":"")+")");
            if(start>=3)s.execute("update accounts set opening_balance=1000,opening_date='2026-09-07',opening_origin='USER_PROVIDED',opening_recorded_at='2026-09-08 02:00:00+00'");
            if(start==4){
                s.execute("insert into categories(id,name,type,is_system_reserved,user_id) values ('30000000-0000-0000-0000-000000000001','Review','EXPENSE',false,'10000000-0000-0000-0000-000000000001')");
                s.execute("insert into credit_cards(id,name,last_4_digits,card_limit,closing_day,due_day,user_id) values ('50000000-0000-0000-0000-000000000001','Review','1234',1000,20,28,'10000000-0000-0000-0000-000000000001')");
                s.execute("insert into invoices(id,month,year,status,card_id,closing_date,due_date) values ('51000000-0000-0000-0000-000000000001',9,2026,'OPEN','50000000-0000-0000-0000-000000000001','2026-09-20','2026-09-28')");
                s.execute("insert into card_transactions(id,description,amount,date,created_at,invoice_id,category_id,origin,paid_amount,refunded_amount,purchase_id) values ('52000000-0000-0000-0000-000000000001','Canonical purchase',100,'2026-09-07','2026-09-07 09:00:00','51000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','PURCHASE',20,5,'53000000-0000-0000-0000-000000000001')");
            }
            String before=snapshot(s);
            if(start>=5){
                s.execute("insert into investments(id,ticker,name,type,quantity,average_price,current_price,user_id,total_cost,valuation_amount,valuation_date,valuation_source) values ('60000000-0000-0000-0000-000000000001','KNOWN','Known','STOCK',3,0.33,0.33,'10000000-0000-0000-0000-000000000001',1,1,'2026-09-07','USER_PROVIDED')");
                s.execute("insert into investments(id,ticker,name,type,quantity,average_price,current_price,user_id,total_cost,valuation_amount) values ('60000000-0000-0000-0000-000000000002','UNKNOWN','Unknown','STOCK',3,0,null,'10000000-0000-0000-0000-000000000001',null,null)");
                s.execute("insert into invest_transactions(id,type,date,quantity,price,total_value,fees,investment_id) values ('61000000-0000-0000-0000-000000000001','BUY','2026-09-07 23:30:45.123456',3,0.33,1,0,'60000000-0000-0000-0000-000000000001')");
            }
            assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isEqualTo(8-start);
            if(start>=5){
                assertThat(scalar(s,"select concat(replay_quantity,':',replay_cost,':',valuation_amount) from investments where ticker='KNOWN'")).isEqualTo("3.00000000:1.00:1.00");
                assertThat(scalar(s,"select replay_cost::text from investments where ticker='UNKNOWN'")).isNull();
                assertThat(scalar(s,"select sequence_number::text from invest_transactions")).isNull();
                assertThat(scalar(s,"select date::text from invest_transactions")).isEqualTo("2026-09-07 23:30:45.123456");
            }
            assertThat(snapshot(s)).as("row-by-row temporal bytes, nulls, relations and amounts").isEqualTo(before);
            assertThat(scalar(s,"select status from transactions where id='40000000-0000-0000-0000-000000000002'")).isEqualTo("PENDING");
            assertThat(scalar(s,"select origin from transactions where id='40000000-0000-0000-0000-000000000002'")).isNull();
            if(start>=3){
                assertThat(scalar(s,"select origin from transactions where id='40000000-0000-0000-0000-000000000001'")).isEqualTo("USER");
                assertThat(scalar(s,"select opening_balance::text from accounts")).isEqualTo("1000.00");
            }
            if(start==4){
                assertThat(scalar(s,"select concat(origin,':',paid_amount,':',refunded_amount) from card_transactions")).isEqualTo("PURCHASE:20.00:5.00");
                assertThat(scalar(s,"select concat(closing_date,':',due_date) from invoices")).isEqualTo("2026-09-20:2026-09-28");
            }
            assertThatThrownBy(()->s.execute("update transactions set origin='REVERSAL' where id='40000000-0000-0000-0000-000000000001'"))
                    .isInstanceOf(SQLException.class).hasMessageContaining("ck_transactions_reversal_metadata");
            Cf017PostgresSupport.flyway(schema).validate();
            assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isZero();
        }
    }
    private String snapshot(Statement s)throws SQLException {
        return scalar(s,"select jsonb_agg(to_jsonb(t) order by id)::text from (select id,description,amount,date,is_paid,type,account_id,user_id,is_system_managed,created_at,operation_time,time_origin,recorded_at,legacy_created_at_raw from transactions) t");
    }
    private String scalar(Statement s,String q)throws SQLException{try(ResultSet r=s.executeQuery(q)){r.next();return r.getString(1);}}
}
