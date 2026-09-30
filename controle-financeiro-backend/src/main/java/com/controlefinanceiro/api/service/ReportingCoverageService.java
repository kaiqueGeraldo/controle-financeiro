package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.summary.dto.ReportingCoverageDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.UUID;

/** Two aggregate queries per scope, including archived sources. No per-row source lookup. */
@Service
public class ReportingCoverageService {
    private final NamedParameterJdbcTemplate sql;
    private final Clock clock;
    public ReportingCoverageService(NamedParameterJdbcTemplate sql, Clock clock) { this.sql=sql; this.clock=clock; }

    public ReportingCoverageDTO assess(User user, LocalDate from, LocalDate through, TransactionType type,
            UUID accountId, boolean managerial) {
        var args=new HashMap<String,Object>();
        args.put("owner",user.getId()); args.put("account",accountId);
        args.put("from",from); args.put("through",through); args.put("type",type==null?null:type.name());
        args.put("cards",managerial&&accountId==null&&(type==null||type==TransactionType.EXPENSE));
        args.put("assets",managerial&&accountId==null&&type==null);
        var base=sql.queryForMap("""
            WITH sources AS (
              SELECT CASE WHEN opening_origin IN ('USER_PROVIDED','SYSTEM_INITIALIZED')
                    AND opening_balance IS NOT NULL AND opening_recorded_at IS NOT NULL THEN opening_date END AS base
              FROM accounts WHERE user_id=:owner AND (CAST(:account AS uuid) IS NULL OR id=CAST(:account AS uuid))
              UNION ALL
              SELECT COALESCE((SELECT min(b.base_date) FROM card_opening_batches b WHERE b.card_id=c.id),reporting_known_from)
              FROM credit_cards c WHERE user_id=:owner AND :cards
              UNION ALL
              SELECT reporting_known_from FROM investments WHERE user_id=:owner AND :assets
            ) SELECT count(*) AS sources,count(*) FILTER(WHERE base IS NULL) AS unknown,max(base) AS base FROM sources
            """,args);
        long sources=((Number)base.get("sources")).longValue();
        if(accountId!=null&&sources==0)throw new ResourceNotFoundException("Conta não encontrada");
        long unknown=((Number)base.get("unknown")).longValue();
        LocalDate known=unknown>0?null:base.get("base")==null?LocalDate.now(clock):((java.sql.Date)base.get("base")).toLocalDate();
        long unknownFacts=sql.queryForObject("""
            SELECT count(*) FROM (
            SELECT t.id FROM transactions t LEFT JOIN transactions original
              ON original.id=COALESCE(t.reversal_of_id,t.correction_of_id) AND original.user_id=:owner
            WHERE t.user_id=:owner AND t.date BETWEEN :from AND :through
              AND (t.status IN ('SETTLED','REVERSED') OR (t.status IS NULL AND t.is_paid))
              AND (CAST(:account AS uuid) IS NULL OR t.account_id=CAST(:account AS uuid))
              AND (CAST(:type AS varchar) IS NULL OR t.type=CAST(:type AS varchar))
              AND (t.origin IS NULL OR t.origin='UNKNOWN'
                   OR (t.origin IN ('REVERSAL','CORRECTION') AND (original.origin IS NULL OR original.origin='UNKNOWN'))
                   OR (t.type='TRANSFER' AND COALESCE(t.transfer_direction,original.transfer_direction) IS NULL))
            UNION ALL
            SELECT t.id FROM card_transactions t JOIN invoices i ON i.id=t.invoice_id
              JOIN credit_cards c ON c.id=i.card_id
            WHERE c.user_id=:owner AND :cards AND t.date BETWEEN :from AND :through
              AND (t.origin IS NULL OR t.origin='LEGACY_UNKNOWN')
            ) unknown_facts
            """,args,Long.class);
        return interval(from,through,known,LocalDate.now(clock),unknown+unknownFacts);
    }

    public ReportingCoverageDTO interval(LocalDate from, LocalDate through, LocalDate known, LocalDate today, long unknown) {
        String state; String reason;
        if(unknown>0){state="UNKNOWN_ORIGIN";reason="Origem ou base desconhecida; reconciliação necessária.";}
        else if(through.isBefore(known)||from.isAfter(today)){state="UNAVAILABLE";reason="Período fora da cobertura conhecida.";}
        else if(from.isBefore(known)||through.isAfter(today)){state="PARTIAL";reason="Período parcialmente coberto; somente valores registrados estão disponíveis.";}
        else{state="COMPLETE";reason="Período coberto até a data de referência.";}
        return new ReportingCoverageDTO(state,from,through,known,today,unknown,reason);
    }
}
