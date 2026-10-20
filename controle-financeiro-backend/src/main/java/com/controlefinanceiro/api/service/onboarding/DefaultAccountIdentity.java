package com.controlefinanceiro.api.service.onboarding;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import java.time.Instant;
import java.util.UUID;

/** Only the registration producer knows this identity; no backfill from name/type. */
@Component
public class DefaultAccountIdentity {
    private final JdbcTemplate jdbc;
    public DefaultAccountIdentity(JdbcTemplate jdbc) {this.jdbc=jdbc;}
    @Transactional(propagation=Propagation.MANDATORY)
    public void record(UUID owner,UUID account,Instant now) {
        jdbc.update("insert into onboarding_default_accounts(user_id,account_id,recorded_at) values(?,?,?)",owner,account,java.sql.Timestamp.from(now));
    }
}
