package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.onboarding.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

/** Bounded streaming materialization, one query per relation, all rows owner-scoped.
 * Must run under exclusive FinancialInventoryGuard in the enclosing transaction. */
@Component
public class OnboardingInventory {
    private final JdbcTemplate jdbc;
    private final long maxBytes;
    private final long maxRelations;
    public OnboardingInventory(JdbcTemplate jdbc,@Value("${onboarding.snapshot.max-bytes:33554432}") long maxBytes,
            @Value("${onboarding.snapshot.max-relations:200000}") long maxRelations) {
        if(maxBytes<1 || maxRelations<1)throw new IllegalArgumentException("Snapshot capacity must be positive");
        this.jdbc=jdbc;this.maxBytes=maxBytes;this.maxRelations=maxRelations;
    }
    public long maxRelations() {return maxRelations;}
    public record Snapshot(ObjectNode rows,String token) {
        public JsonNode table(String name) {return rows.path(name);}
    }
    public Snapshot load(UUID owner) {
        return load(owner,Set.of());
    }
    public Snapshot load(UUID owner,Set<UUID> categoryIds) {
        jdbc.execute("set local time zone 'UTC'"); // stable instant tokens across connection/JVM zones; civil dates stay literal
        Map<String,String> queries=new LinkedHashMap<>();
        queries.put("accounts","""
            select a.*, case when d.account_id is null then false else
              exists(select 1 from transactions t where t.user_id=a.user_id and t.account_id=a.id) end as used
            from accounts a left join onboarding_default_accounts d on d.user_id=a.user_id and d.account_id=a.id
            where a.user_id=?
            """);
        queries.put("investments","select * from investments where user_id=?");
        queries.put("goals","select * from goals where user_id=?");
        queries.put("allocations","select a.* from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=?");
        queries.put("cards","""
            select c.*, exists(select 1 from card_opening_batches b where b.card_id=c.id) as opened,
              (exists(select 1 from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=c.id)
               or exists(select 1 from card_payments p join invoices i on i.id=p.invoice_id where i.card_id=c.id)
               or exists(select 1 from card_refunds r where r.card_id=c.id)) as used
            from credit_cards c where c.user_id=?
            """);
        queries.put("invoices","""
            select i.* from invoices i join credit_cards c on c.id=i.card_id where c.user_id=?
              and (not exists(select 1 from card_transactions t where t.invoice_id=i.id)
               or exists(select 1 from card_transactions t where t.invoice_id=i.id
                  and t.amount<>t.paid_amount+t.refunded_amount and (t.origin<>'LEGACY_UNKNOWN' or i.status<>'PAID')))
            """);
        queries.put("lines","""
            select t.* from card_transactions t join invoices i on i.id=t.invoice_id join credit_cards c on c.id=i.card_id
            where c.user_id=? and t.amount<>t.paid_amount+t.refunded_amount
              and (t.origin<>'LEGACY_UNKNOWN' or i.status<>'PAID')
            """);
        queries.put("categories","select id,type from categories where user_id=? and id=any(?)");
        queries.put("defaults","select * from onboarding_default_accounts where user_id=?");
        queries.put("reservations","select * from onboarding_reservation_records where user_id=?");
        ObjectNode rows=object();long[] bytes={0};
        for(var query:queries.entrySet()) {
            var list=JSON.createArrayNode();
            jdbc.query(c->{var ps=c.prepareStatement("select row_to_json(q)::text from ("+query.getValue()+") q order by 1");
                ps.setObject(1,owner);if(query.getKey().equals("categories"))ps.setArray(2,c.createArrayOf("uuid",categoryIds.toArray()));ps.setFetchSize(256);return ps;},(org.springframework.jdbc.core.RowCallbackHandler)rs->{
                String raw=rs.getString(1);bytes[0]+=raw.getBytes(StandardCharsets.UTF_8).length;
                if(bytes[0]>maxBytes) throw capacity();list.add(JSON.readTree(raw));
            });
            rows.set(query.getKey(),list);
        }
        return new Snapshot(rows,hash(rows));
    }
    public void check(JsonNode result) {
        if(result.toString().getBytes(StandardCharsets.UTF_8).length>maxBytes) throw capacity();
    }
    private static DraftProblem capacity() {return new DraftProblem(503,"SUMMARY_CAPACITY_EXCEEDED");}
}
