package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import java.util.UUID;
import java.util.stream.Stream;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class OnboardingRc030VersionTest extends OnboardingApplicationSupport {
    static Stream<Arguments> invalidVersions() {
        return Stream.of("prepare","complete").flatMap(route->Stream.of("0","2","-1","2147483647","2147483648","-2147483649","4294967297","9223372036854775807","9223372036854775808","999999999999999999999999999999999999999999999999999999","1.0","1e0","\"1\"","true","null").map(value->Arguments.of(route,value)));
    }
    @ParameterizedTest @MethodSource("invalidVersions")
    void invalidContractVersionIs400BeforeAnyApplication(String route,String raw) throws Exception {
        save(minimal());var command=command(UUID.randomUUID());
        var body=route.equals("prepare")?node("contractVersion",1,"sessionId",command.sessionId().toString(),"expectedVersion","1","operationId",command.operationId().toString()):request(completeCommand(app.prepare(user.getId(),command)));
        String json=body.toString().replace("\"contractVersion\":1","\"contractVersion\":"+raw);
        var response=mvc.perform(post("/onboarding/"+route).header("Authorization","Bearer "+token).contentType("application/json").content(json)).andReturn().getResponse();
        assertThat(response.getStatus()).as(raw+" / "+route).isEqualTo(400);
        var error=JSON.readTree(response.getContentAsString()).path("error");assertThat(error.path("code").asText()).isEqualTo("INVALID_FIELD");
        assertThat(error.at("/fieldErrors/0/path").asText()).isEqualTo("/contractVersion");assertThat(error.at("/fieldErrors/0/code").asText()).isEqualTo("INVALID_COMMAND");
        assertThat(response.getContentAsString()).doesNotContain("JsonNodeException","java.","tools.jackson","StackTrace");
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from onboarding_preparations where user_id=?",Integer.class,user.getId())).isEqualTo(route.equals("prepare")?0:1);
        assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(drafts.get(user.getId()).version()).isEqualTo("1");
    }
    @Test void onlyContractOneIsAcceptedAndDraftVersionsKeepTheirOwnErrors() throws Exception {
        save(minimal());var c=command(UUID.randomUUID());
        var body=node("contractVersion",1,"sessionId",c.sessionId().toString(),"expectedVersion","0","operationId",c.operationId().toString());
        assertThat(http("/onboarding/prepare",body,409,token).at("/error/code").asText()).isEqualTo("VERSION_CONFLICT");
        body.put("expectedVersion","9223372036854775808");assertThat(http("/onboarding/prepare",body,400,token).at("/error/fieldErrors/0/code").asText()).isEqualTo("REVISION_INVALID");
        body.put("expectedVersion","1");var prepared=http("/onboarding/prepare",body,200,token).path("data");var confirmation=request(completeCommand(prepared));
        var first=http("/onboarding/complete",confirmation,200,token);assertThat(http("/onboarding/complete",confirmation,200,token)).isEqualTo(first);
    }
    @Test void internalPersistenceFailureWithValidVersionRemainsSanitized500() throws Exception {
        save(minimal());var c=command(UUID.randomUUID());
        sql.execute("create function rc030_reject_preparation() returns trigger language plpgsql as $$ begin if new.user_id='"+user.getId()+"'::uuid then raise exception 'RC030 synthetic internal failure'; end if; return new; end; $$");
        sql.execute("create trigger rc030_fail_preparation before insert on onboarding_preparations for each row execute function rc030_reject_preparation()");
        try {var error=http("/onboarding/prepare",node("contractVersion",1,"sessionId",c.sessionId().toString(),"expectedVersion","1","operationId",c.operationId().toString()),500,token);assertThat(error.at("/error/code").asText()).isEqualTo("INTERNAL_ERROR");assertThat(error.toString()).doesNotContain("synthetic","SQLException","org.postgresql");}
        finally {sql.execute("drop trigger rc030_fail_preparation on onboarding_preparations");sql.execute("drop function rc030_reject_preparation()");}
        assertThat(sql.queryForObject("select count(*) from onboarding_preparations where user_id=?",Integer.class,user.getId())).isZero();assertThat(drafts.get(user.getId()).version()).isEqualTo("1");
    }
}
