package com.controlefinanceiro.api.infra.security;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.HttpMethod;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@ContextConfiguration(initializers = IsolationSchemaInitializer.class)
class UserIsolationIntegrationTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate sql;
    @Autowired JsonMapper json;
    @Autowired UserRepository users;
    @Autowired TokenService tokens;
    @Autowired org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping mappings;
    @MockitoBean Clock clock;
    Map<String,String> ids;
    String tokenA, tokenB;

    @BeforeEach void fixtures() throws Exception {
        when(clock.instant()).thenReturn(Instant.parse("2026-09-30T15:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        ids = new HashMap<>();
        for (String owner : List.of("A", "B")) {
            User user = new User(); user.setNome("CF023-" + owner);
            user.setEmail("cf023-" + owner + "-" + UUID.randomUUID() + "@example.invalid"); user.setSenha("synthetic-hash");
            user = users.save(user); ids.put("user" + owner, user.getId().toString());
            String token = tokens.generateToken(user);
            if (owner.equals("A")) tokenA = token; else tokenB = token;
            ids.put("account" + owner, create("/accounts", """
                    {"name":"PRIVATE-ACCOUNT-%s","type":"CHECKING","initialBalance":%s,"openingDate":"2026-09-01"}
                    """.formatted(owner, owner.equals("A") ? "1000" : "2300"), token));
            sql.update("update accounts set order_index=7 where id=?::uuid", ids.get("account"+owner));
            ids.put("category" + owner, create("/categories", """
                    {"name":"PRIVATE-CATEGORY-%s","icon":"Tag","color":"#123456","type":"EXPENSE"}
                    """.formatted(owner), token));
            ids.put("card" + owner, create("/cards", """
                    {"name":"PRIVATE-CARD-%s","last4Digits":"1234","limit":5000,"closingDay":20,"dueDay":28,"brand":"Visa"}
                    """.formatted(owner), token));
            ids.put("goal" + owner, create("/goals", """
                    {"title":"PRIVATE-GOAL-%s","targetValue":500,"deadline":"2027-01-01","type":"MONETARY","useChecklist":true}
                    """.formatted(owner), token));
            ids.put("numeric" + owner, create("/goals", """
                    {"title":"PRIVATE-NUMERIC-%s","targetValue":10,"deadline":"2027-01-01","type":"NUMERIC"}
                    """.formatted(owner), token));
            ids.put("item"+owner, create("/goals/"+ids.get("goal"+owner)+"/items", """
                    {"name":"PRIVATE-ITEM","estimatedPrice":20}
                    """, token));
            ids.put("investment" + owner, create("/investments", """
                    {"ticker":"CF023","name":"PRIVATE-INVESTMENT-%s","type":"STOCK"}
                    """.formatted(owner), token));
            ids.put("habit"+owner, create("/habits", """
                    {"name":"PRIVATE-HABIT-%s","icon":"Check","color":"#123456","frequency":"DAILY"}
                    """.formatted(owner), token));
            ids.put("plan"+owner, create("/planning", resolve("""
                    {"description":"PRIVATE-PLAN","amount":30,"dueDate":"2026-09-30","categoryId":"{category%s}"}
                    """.formatted(owner)), token));
            ids.put("transaction"+owner, create("/transactions", resolve("""
                    {"description":"PRIVATE-TX","amount":40,"date":"2026-09-30","type":"EXPENSE","accountId":"{account%s}","isPaid":false}
                    """.formatted(owner)), token));
            mvc.perform(post("/cards/transaction").header("Authorization","Bearer "+token).contentType("application/json")
                    .content(resolve("{\"description\":\"PRIVATE-CARD-TX\",\"amount\":20,\"date\":\"2026-09-01\",\"cardId\":\"{card"+owner+"}\",\"categoryId\":\"{category"+owner+"}\",\"totalInstallments\":1}")))
                    .andExpect(status().isOk());
            ids.put("cardTx"+owner,sql.queryForObject("select t.id::text from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?::uuid",String.class,ids.get("card"+owner)));
            mvc.perform(post("/goals/"+ids.get("numeric"+owner)+"/deposit").header("Authorization","Bearer "+token).contentType("application/json").content("{\"amount\":1}"))
                    .andExpect(status().isOk());
            ids.put("history"+owner,sql.queryForObject("select id::text from goal_history where goal_id=?::uuid",String.class,ids.get("numeric"+owner)));
        }
        ids.put("command",UUID.randomUUID().toString());
    }

    record Case(String method, String path, String body) {}
    static Stream<Case> foreignReferences() {
        return Stream.of(
            new Case("PUT","/accounts/{accountB}","{\"name\":\"changed\",\"type\":\"CHECKING\"}"),
            new Case("DELETE","/accounts/{accountB}",null),
            new Case("PUT","/categories/{categoryB}","{\"name\":\"changed\",\"type\":\"EXPENSE\",\"icon\":\"Tag\",\"color\":\"#123456\"}"),
            new Case("DELETE","/categories/{categoryB}",null),
            new Case("GET","/cards/{cardB}/invoice?month=9&year=2026",null),
            new Case("DELETE","/cards/{cardB}",null),
            new Case("GET","/goals/{goalB}/history",null),
            new Case("GET","/goals/{goalB}/allocations",null),
            new Case("PUT","/goals/{goalB}","{\"title\":\"changed\"}"),
            new Case("DELETE","/goals/{goalB}",null),
            new Case("POST","/goals/{goalB}/items","{\"name\":\"changed\",\"estimatedPrice\":20}"),
            new Case("DELETE","/goals/items/{itemB}",null),
            new Case("POST","/goals/{numericB}/deposit","{\"amount\":1}"),
            new Case("PUT","/goals/{goalA}/allocations","{\"accountId\":\"{accountB}\",\"amount\":\"10\"}"),
            new Case("PUT","/goals/{goalB}/allocations","{\"accountId\":\"{accountA}\",\"amount\":\"10\"}"),
            new Case("POST","/investments","{\"ticker\":\"TEST\",\"name\":\"test\",\"type\":\"STOCK\",\"goalId\":\"{goalB}\"}"),
            new Case("GET","/investments/{investmentB}/history",null),
            new Case("GET","/investments/{investmentB}/corrections",null),
            new Case("DELETE","/investments/{investmentB}",null),
            new Case("POST","/investments/operation","{\"investmentId\":\"{investmentB}\",\"accountId\":\"{accountA}\",\"type\":\"BUY\",\"quantity\":1,\"price\":10,\"date\":\"2026-09-30\"}"),
            new Case("POST","/habits","{\"name\":\"test\",\"icon\":\"Check\",\"color\":\"#123456\",\"goalId\":\"{numericB}\"}"),
            new Case("PUT","/habits/{habitB}","{\"name\":\"changed\"}"),
            new Case("DELETE","/habits/{habitB}",null),
            new Case("POST","/habits/{habitB}/toggle","{\"date\":\"2026-09-30\"}"),
            new Case("DELETE","/planning/{planB}",null),
            new Case("PATCH","/planning/{planB}/status","{\"status\":\"PAID\"}"),
            new Case("POST","/planning","{\"description\":\"test\",\"amount\":20,\"dueDate\":\"2026-09-30\",\"categoryId\":\"{categoryB}\"}"),
            new Case("DELETE","/transactions/{transactionB}",null),
            new Case("POST","/transactions","{\"description\":\"test\",\"amount\":20,\"date\":\"2026-09-30\",\"type\":\"EXPENSE\",\"accountId\":\"{accountB}\",\"isPaid\":true}"),
            new Case("POST","/transactions","{\"description\":\"test\",\"amount\":20,\"date\":\"2026-09-30\",\"type\":\"EXPENSE\",\"accountId\":\"{accountA}\",\"categoryId\":\"{categoryB}\",\"isPaid\":true}"),
            new Case("POST","/cards/transaction","{\"description\":\"test\",\"amount\":20,\"date\":\"2026-09-30\",\"cardId\":\"{cardB}\",\"categoryId\":\"{categoryA}\",\"totalInstallments\":1}"),
            new Case("POST","/cards/transaction","{\"description\":\"test\",\"amount\":20,\"date\":\"2026-09-30\",\"cardId\":\"{cardA}\",\"categoryId\":\"{categoryB}\",\"totalInstallments\":1}"),
            new Case("PUT","/cards/{cardB}","{\"name\":\"changed\"}"),
            new Case("PATCH","/cards/transaction/{cardTxB}","{\"description\":\"changed\"}"),
            new Case("PATCH","/cards/transaction/{cardTxA}","{\"categoryId\":\"{categoryB}\"}"),
            new Case("DELETE","/cards/transaction/{cardTxB}",null),
            new Case("POST","/cards/{cardB}/pay","{\"accountId\":\"{accountA}\",\"amount\":10,\"date\":\"2026-09-30\",\"month\":9,\"year\":2026,\"isPrepayment\":true,\"operationId\":\"{command}\"}"),
            new Case("POST","/cards/{cardA}/pay","{\"accountId\":\"{accountB}\",\"amount\":10,\"date\":\"2026-09-30\",\"month\":9,\"year\":2026,\"isPrepayment\":true,\"operationId\":\"{command}\"}"),
            new Case("DELETE","/goals/history/{historyB}",null),
            new Case("PATCH","/goals/items/{itemB}/purchase","{\"paidPrice\":10,\"accountId\":\"{accountA}\"}"),
            new Case("PATCH","/goals/items/{itemA}/purchase","{\"paidPrice\":10,\"accountId\":\"{accountB}\"}"),
            new Case("POST","/goals/items/{itemB}/refund",null),
            new Case("PUT","/planning/{planB}","{\"description\":\"changed\"}"),
            new Case("PUT","/planning/{planA}","{\"categoryId\":\"{categoryB}\"}"),
            new Case("PUT","/habits/{habitA}","{\"goalId\":\"{numericB}\"}"),
            new Case("PUT","/transactions/{transactionB}","{\"description\":\"changed\"}"),
            new Case("POST","/transactions/{transactionB}/settlements","{\"amount\":\"10\",\"date\":\"2026-09-30\",\"operationId\":\"{command}\"}"),
            new Case("POST","/transactions/{transactionB}/reversals","{\"amount\":\"10\",\"date\":\"2026-09-30\",\"operationId\":\"{command}\",\"reason\":\"test\"}"),
            new Case("POST","/investments/update-balance","{\"investmentId\":\"{investmentB}\",\"newBalance\":10,\"date\":\"2026-09-30\",\"source\":\"test\",\"reason\":\"test\"}"),
            new Case("POST","/investments/operation","{\"investmentId\":\"{investmentA}\",\"accountId\":\"{accountB}\",\"type\":\"BUY\",\"quantity\":1,\"price\":10,\"date\":\"2026-09-30\"}")
        );
    }

    @ParameterizedTest @MethodSource("foreignReferences")
    void foreignUuidIs404AndCannotChangeEitherUser(Case scenario) throws Exception {
        var before = snapshot();
        var response = mvc.perform(request(HttpMethod.valueOf(scenario.method()), resolve(scenario.path()))
                .header("Authorization", "Bearer " + tokenA).contentType("application/json")
                .content(resolve(scenario.body() == null ? "" : scenario.body()))).andReturn().getResponse();
        assertThat(snapshot()).as("No partial writes: %s",scenario).isEqualTo(before);
        assertThat(response.getStatus()).as("%s", scenario).isEqualTo(404);
        assertThat(response.getContentAsString()).doesNotContain("PRIVATE-", tokenB, "synthetic-hash");
        var missing=mvc.perform(request(HttpMethod.valueOf(scenario.method()),resolveMissing(scenario.path()))
                .header("Authorization","Bearer "+tokenA).contentType("application/json")
                .content(resolveMissing(scenario.body()==null?"":scenario.body()))).andExpect(status().isNotFound()).andReturn().getResponse();
        for(String field:List.of("status","error","message","fields"))
            assertThat(json.readTree(response.getContentAsString()).get(field)).as("Uniform foreign/missing %s: %s",field,scenario)
                    .isEqualTo(json.readTree(missing.getContentAsString()).get(field));
        assertThat(snapshot()).isEqualTo(before);
        mvc.perform(get("/accounts").header("Authorization","Bearer "+tokenA)).andExpect(status().isOk());
    }

    @ParameterizedTest @ValueSource(strings={"accounts","cards","habits","planning"})
    void mixedReordersRejectAtomicallyIncludingMissingIds(String kind) throws Exception {
        var before = snapshot();
            String key = switch (kind) { case "accounts" -> "account"; case "cards" -> "card"; case "habits" -> "habit"; default -> "plan"; };
            for (String denied : List.of(ids.get(key+"B"), UUID.randomUUID().toString())) {
                var response = mvc.perform(patch("/"+kind+"/reorder").header("Authorization","Bearer "+tokenA)
                        .contentType("application/json").content("[\""+ids.get(key+"A")+"\",\""+denied+"\"]")).andReturn().getResponse();
                assertThat(snapshot()).as("%s reorder must have no effect",kind).isEqualTo(before);
                assertThat(response.getStatus()).as("%s reorder",kind).isEqualTo(404);
            }
    }
    @Test void wrongGoalItemReorderIsRejectedWithoutWrites() throws Exception {
        var before=snapshot();
        mvc.perform(patch(resolve("/goals/{goalA}/items/reorder")).header("Authorization","Bearer "+tokenA)
                .contentType("application/json").content(resolve("[\"{itemA}\",\"{itemB}\"]"))).andExpect(status().isNotFound());
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test void ownerControlsAndAlternateReadsKeepExactBalancesAndSecretsHidden() throws Exception {
        for (String token : List.of(tokenA,tokenB,tokenA,tokenB)) {
            String owner = token.equals(tokenA)?"A":"B";
            for (String path : List.of("/accounts","/accounts/position","/categories","/cards","/goals","/goals/purchases","/investments","/habits","/planning?month=9&year=2026","/transactions?month=9&year=2026","/annual-summary?year=2026","/dashboard/flow?month=9&year=2026","/dashboard/chart?period=year","/auth/user")) {
                var response = mvc.perform(get(path).header("Authorization","Bearer "+token)).andExpect(status().isOk()).andReturn().getResponse();
                assertThat(response.getContentAsString()).doesNotContain("PRIVATE-ACCOUNT-"+(owner.equals("A")?"B":"A"), "synthetic-hash", "recoveryToken", "password");
                if (path.equals("/accounts/position")) assertThat(json.readTree(response.getContentAsString()).get("totalBalance").asText()).isEqualTo(owner.equals("A")?"1000.00":"2300.00");
            }
        }
        mvc.perform(patch("/accounts/reorder").header("Authorization","Bearer "+tokenA).contentType("application/json")
                .content(resolve("[\"{accountA}\"]"))).andExpect(status().isNoContent());
        assertThat(sql.queryForObject("select order_index from accounts where id=?::uuid",Integer.class,ids.get("accountA"))).isZero();
        assertThat(sql.queryForObject("select order_index from accounts where id=?::uuid",Integer.class,ids.get("accountB"))).isEqualTo(7);
    }

    @Test void authorizationHeaderMustBeBearer() throws Exception {
        for (String header : List.of(tokenA, "Basic "+tokenA, "Bearer "+tokenA+" extra"))
            mvc.perform(get("/accounts").header("Authorization",header)).andExpect(status().isUnauthorized());
        mvc.perform(get("/accounts").header("Authorization","bearer "+tokenA)).andExpect(status().isOk());
    }
    @Test void identityMustSurviveEmailRecycling() throws Exception {
        User a = users.findById(UUID.fromString(ids.get("userA"))).orElseThrow();
        User b = users.findById(UUID.fromString(ids.get("userB"))).orElseThrow();
        String oldEmail = a.getEmail(); a.setEmail("renamed-"+UUID.randomUUID()+"@example.invalid"); users.save(a);
        b.setEmail(oldEmail); users.save(b);
        mvc.perform(get("/accounts").header("Authorization","Bearer "+tokenA)).andExpect(status().isUnauthorized());
    }

    @Test void everyPrivateMappingRejectsMissingMalformedInvalidAndExpiredTokens() throws Exception {
        var before=snapshot();
        when(clock.instant()).thenReturn(Instant.parse("2026-10-01T15:00:00Z")); // Exact 24h expiration.
        String invalid=com.auth0.jwt.JWT.create().withIssuer("controle-financeiro-api").withSubject("synthetic")
                .withExpiresAt(Instant.parse("2026-10-02T15:00:00Z"))
                .sign(com.auth0.jwt.algorithms.Algorithm.HMAC256("wrong-synthetic-secret"));
        int requests=0;
        List<String> inventory = new ArrayList<>();
        for(var mapping:mappings.getHandlerMethods().entrySet()) {
            if (!mapping.getValue().getBeanType().getPackageName().equals("com.controlefinanceiro.api.controller")) continue;
            for(String pattern:mapping.getKey().getPatternValues()) {
                if (List.of("/auth/login","/auth/register","/auth/recover-password","/auth/reset-password").contains(pattern)) continue;
                String path=pattern.replaceAll("\\{[^}]+}",UUID.randomUUID().toString());
                for(var method:mapping.getKey().getMethodsCondition().getMethods()) {
                    inventory.add(method.name()+"\t"+pattern+"\t401: absent, malformed, wrong signature, exact expiration; SQL unchanged");
                    for(String credential:List.of("", "Bearer malformed", "Bearer "+invalid, "Bearer "+tokenA)) {
                        var request=request(HttpMethod.valueOf(method.name()),path).contentType("application/json").content("{}");
                        if (!credential.isEmpty()) request.header("Authorization",credential);
                        var response=mvc.perform(request).andExpect(status().isUnauthorized()).andReturn().getResponse();
                        var error=json.readTree(response.getContentAsString());
                        if (pattern.equals("/onboarding") || pattern.startsWith("/onboarding/")) {
                            // SPEC-001 defines a separate envelope; retain the same authentication oracle.
                            assertThat(error.at("/error/code").asText()).isEqualTo("UNAUTHENTICATED");
                            assertThat(error.at("/error/message").asText()).isEqualTo("Autenticação necessária para acessar este recurso.");
                            assertThat(error.at("/error/fieldErrors").isArray()).isTrue();
                            assertThat(error.at("/error/fieldErrors").size()).isZero();
                        } else {
                            assertThat(error.get("message").asText()).isEqualTo("Autenticação necessária para acessar este recurso.");
                            assertThat(error.get("fields").size()).isZero();
                        }
                        requests++;
                    }
                }
            }
        }
        assertThat(requests).isGreaterThanOrEqualTo(240);
        assertThat(snapshot()).isEqualTo(before);
        String inventoryPath = System.getProperty("cf023.inventory");
        if (inventoryPath != null) {
            inventory.sort(String::compareTo);
            java.nio.file.Files.write(java.nio.file.Path.of(inventoryPath), inventory);
        }
        System.out.println("CF023 private route/method matrix: " + requests + " requests, all JSON401, no database changes");
    }

    @Test void profileAndPreferenceResponsesCannotSerializeCredentials() throws Exception {
        User a=users.findById(UUID.fromString(ids.get("userA"))).orElseThrow();
        for(String path:List.of("/users/me/profile","/users/me/preferences")) {
            var request=request(path.endsWith("profile")?HttpMethod.PUT:HttpMethod.PATCH,path)
                    .header("Authorization","Bearer "+tokenA).contentType("application/json")
                    .content(path.endsWith("profile")?"{\"nome\":\"Changed\",\"email\":\""+a.getEmail()+"\"}":"{\"privacyMode\":true}");
            var response=mvc.perform(request).andExpect(status().isOk()).andReturn().getResponse();
            assertThat(response.getContentAsString()).doesNotContain("synthetic-hash","password","senha","recoveryToken","authorities");
            assertThat(json.readTree(response.getContentAsString()).get("id").asText()).isEqualTo(ids.get("userA"));
        }
    }

    @Test void missingAndForeignResourceErrorsHaveIdenticalPublicShape() throws Exception {
        for(String route:List.of("/investments/{investmentB}/history","/goals/{goalB}/history","/cards/{cardB}/invoice?month=9&year=2026")) {
            var foreign=mvc.perform(get(resolve(route)).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound()).andReturn().getResponse();
            var missing=mvc.perform(get(route.replaceAll("\\{[^}]+}",UUID.randomUUID().toString())).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound()).andReturn().getResponse();
            var first=json.readTree(foreign.getContentAsString());var second=json.readTree(missing.getContentAsString());
            for(String field:List.of("status","error","message","fields")) assertThat(first.get(field)).isEqualTo(second.get(field));
        }
    }

    @Test void exportAndFilteredAggregatesCannotLeakAnotherOwner() throws Exception {
        create("/transactions",resolve("{\"description\":\"EXPORT-A\",\"amount\":10,\"date\":\"2026-09-30\",\"type\":\"INCOME\",\"accountId\":\"{accountA}\",\"isPaid\":true}"),tokenA);
        create("/transactions",resolve("{\"description\":\"EXPORT-B\",\"amount\":70,\"date\":\"2026-09-30\",\"type\":\"INCOME\",\"accountId\":\"{accountB}\",\"isPaid\":true}"),tokenB);
        for(String owner:List.of("A","B","A")) {
            String token=owner.equals("A")?tokenA:tokenB;
            var response=mvc.perform(get("/transactions/export?month=9&year=2026").header("Authorization","Bearer "+token))
                    .andExpect(status().isOk()).andReturn().getResponse();
            try(var book=new org.apache.poi.xssf.usermodel.XSSFWorkbook(new java.io.ByteArrayInputStream(response.getContentAsByteArray()))) {
                var cells=new ArrayList<String>();
                for(var sheet:book) for(var row:sheet) for(var cell:row) cells.add(new org.apache.poi.ss.usermodel.DataFormatter().formatCellValue(cell));
                assertThat(cells).contains("EXPORT-"+owner).doesNotContain("EXPORT-"+(owner.equals("A")?"B":"A"),"PRIVATE-ACCOUNT-"+(owner.equals("A")?"B":"A"));
            }
            var summary=mvc.perform(get("/transactions/summary?month=9&year=2026").header("Authorization","Bearer "+token))
                    .andExpect(status().isOk()).andReturn().getResponse();
            assertThat(json.readTree(summary.getContentAsString()).get("observed").get("entries").asText()).isEqualTo(owner.equals("A")?"10.00":"70.00");
        }
        var before=snapshot();
        for(String path:List.of("/transactions/summary?month=9&year=2026&accountId=","/transactions/export?month=9&year=2026&accountId=")) {
            for(String id:List.of(ids.get("accountB"),UUID.randomUUID().toString()))
                mvc.perform(get(path+id).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound());
        }
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test void transactionAndPaymentReceiptsAreOwnerBoundAfterRealCommit() throws Exception {
        String settlementKey=UUID.randomUUID().toString(), paymentKey=UUID.randomUUID().toString();
        mvc.perform(post(resolve("/transactions/{transactionB}/settlements")).header("Authorization","Bearer "+tokenB).contentType("application/json")
                .content("{\"amount\":\"10\",\"date\":\"2026-09-30\",\"operationId\":\""+settlementKey+"\"}")).andExpect(status().isOk());
        mvc.perform(post(resolve("/cards/{cardB}/pay")).header("Authorization","Bearer "+tokenB).contentType("application/json")
                .content(resolve("{\"accountId\":\"{accountB}\",\"amount\":10,\"date\":\"2026-09-30\",\"month\":9,\"year\":2026,\"isPrepayment\":true,\"operationId\":\""+paymentKey+"\"}"))).andExpect(status().isOk());
        var before=snapshot();
        for(String path:List.of("/transactions/commands/"+settlementKey,resolve("/cards/{cardB}/payments/")+paymentKey)) {
            mvc.perform(get(path).header("Authorization","Bearer "+tokenB)).andExpect(status().isOk());
            var forbidden=mvc.perform(get(path).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound()).andReturn().getResponse();
            assertThat(forbidden.getContentAsString()).doesNotContain("PRIVATE-",tokenB);
        }
        mvc.perform(get(resolve("/cards/{cardA}/payments/")+paymentKey).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound());
        assertThat(snapshot()).isEqualTo(before);
        assertThat(sql.queryForObject("select balance from accounts where id=?::uuid",java.math.BigDecimal.class,ids.get("accountB")))
                .isEqualByComparingTo("2280.00");
    }

    @Test void investmentCorrectionsAndDeletedGoalItemRefundCannotCrossOwners() throws Exception {
        mvc.perform(post("/investments/operation").header("Authorization","Bearer "+tokenB).contentType("application/json")
                .content(resolve("{\"investmentId\":\"{investmentB}\",\"accountId\":\"{accountB}\",\"type\":\"BUY\",\"quantity\":1,\"price\":10,\"date\":\"2026-09-30\"}"))).andExpect(status().isOk());
        String operation=sql.queryForObject("select id::text from invest_transactions where investment_id=?::uuid",String.class,ids.get("investmentB"));
        mvc.perform(patch(resolve("/goals/items/{itemB}/purchase")).header("Authorization","Bearer "+tokenB).contentType("application/json")
                .content(resolve("{\"paidPrice\":10,\"accountId\":\"{accountB}\"}"))).andExpect(status().isOk());
        mvc.perform(delete(resolve("/goals/items/{itemB}")).header("Authorization","Bearer "+tokenB)).andExpect(status().isNoContent());
        var before=snapshot();
        mvc.perform(post("/investments/operation/"+operation+"/corrections").header("Authorization","Bearer "+tokenA).contentType("application/json")
                .content("{\"operationId\":\""+UUID.randomUUID()+"\",\"date\":\"2026-09-30\",\"reason\":\"test\",\"returnedFees\":\"0\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/investments/operation/"+operation).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound());
        mvc.perform(post(resolve("/goals/items/{itemB}/refund")).header("Authorization","Bearer "+tokenA)).andExpect(status().isNotFound());
        assertThat(snapshot()).isEqualTo(before);
        mvc.perform(post(resolve("/goals/items/{itemB}/refund")).header("Authorization","Bearer "+tokenB)).andExpect(status().isNoContent());
        assertThat(sql.queryForObject("select balance from accounts where id=?::uuid",java.math.BigDecimal.class,ids.get("accountB")))
                .isEqualByComparingTo("2290.00");
    }

    @ParameterizedTest @ValueSource(strings={"accounts","cards","habits","planning","goals"})
    void everyReorderSupportsOwnerAndRejectsDuplicateNullAndSameOwnerWrongParent(String kind) throws Exception {
        String key=switch(kind){case "accounts"->"account";case "cards"->"card";case "habits"->"habit";case "planning"->"plan";default->"item";};
        String path=kind.equals("goals")?resolve("/goals/{goalA}/items/reorder"):"/"+kind+"/reorder";
        var before=snapshot();
        for(String body:List.of("[\""+ids.get(key+"A")+"\",\""+ids.get(key+"A")+"\"]","[null]","null")) {
            mvc.perform(patch(path).header("Authorization","Bearer "+tokenA).contentType("application/json").content(body)).andExpect(status().isBadRequest());
            assertThat(snapshot()).isEqualTo(before);
        }
        mvc.perform(patch(path).header("Authorization","Bearer "+tokenA).contentType("application/json").content("[\""+ids.get(key+"A")+"\"]"))
                .andExpect(status().isNoContent());
        if(kind.equals("goals")) {
            String other=create(resolve("/goals/{numericA}/items"),"{\"name\":\"another parent\",\"estimatedPrice\":20}",tokenA);
            before=snapshot();
            mvc.perform(patch(path).header("Authorization","Bearer "+tokenA).contentType("application/json").content("[\""+other+"\"]"))
                    .andExpect(status().isNotFound());assertThat(snapshot()).isEqualTo(before);
        }
    }

    @Test @org.junit.jupiter.api.extension.ExtendWith(org.springframework.boot.test.system.OutputCaptureExtension.class)
    void recoveryIsUserBoundExpiringSingleUseAndDoesNotLogSecrets(org.springframework.boot.test.system.CapturedOutput output) throws Exception {
        User a=users.findById(UUID.fromString(ids.get("userA"))).orElseThrow();
        User b=users.findById(UUID.fromString(ids.get("userB"))).orElseThrow();
        mvc.perform(post("/auth/recover-password").contentType("application/json").content("{\"email\":\""+a.getEmail()+"\"}")).andExpect(status().isOk());
        String code=users.findById(a.getId()).orElseThrow().getRecoveryToken();
        assertThat(code).matches("[0-9]{6}");
        var beforeB=users.findById(b.getId()).orElseThrow().getSenha();
        mvc.perform(post("/auth/reset-password").contentType("application/json")
                .content("{\"email\":\""+b.getEmail()+"\",\"token\":\""+code+"\",\"novaSenha\":\"Changed-synthetic-password\"}")).andExpect(status().isBadRequest());
        assertThat(users.findById(b.getId()).orElseThrow().getSenha()).isEqualTo(beforeB);
        String reset="{\"email\":\""+a.getEmail()+"\",\"token\":\""+code+"\",\"novaSenha\":\"Changed-synthetic-password\"}";
        when(clock.instant()).thenReturn(Instant.parse("2026-09-30T15:10:00Z"));
        mvc.perform(post("/auth/reset-password").contentType("application/json").content(reset)).andExpect(status().isBadRequest());
        assertThat(users.findById(a.getId()).orElseThrow().getSenha()).isEqualTo("synthetic-hash");
        when(clock.instant()).thenReturn(Instant.parse("2026-09-30T15:09:59Z"));
        mvc.perform(post("/auth/reset-password").contentType("application/json").content(reset)).andExpect(status().isOk());
        assertThat(users.findById(a.getId()).orElseThrow().getRecoveryToken()).isNull();
        String changed=users.findById(a.getId()).orElseThrow().getSenha();
        mvc.perform(post("/auth/reset-password").contentType("application/json").content(reset)).andExpect(status().isBadRequest());
        assertThat(users.findById(a.getId()).orElseThrow().getSenha()).isEqualTo(changed);
        assertThat(output.getAll()).doesNotContain(tokenA,tokenB,code,"Changed-synthetic-password","synthetic-hash");
        org.mockito.Mockito.verify(emailService).sendTemplatedEmail(org.mockito.ArgumentMatchers.eq(a.getEmail()),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.contains(code));
    }

    @Test void recoveryWrongAttemptsPersistAndUnknownEmailHasSamePublicResponse() throws Exception {
        User a=users.findById(UUID.fromString(ids.get("userA"))).orElseThrow();
        var known=mvc.perform(post("/auth/recover-password").contentType("application/json").content("{\"email\":\""+a.getEmail()+"\"}"))
                .andExpect(status().isOk()).andReturn().getResponse();
        var unknown=mvc.perform(post("/auth/recover-password").contentType("application/json").content("{\"email\":\"missing-"+UUID.randomUUID()+"@example.invalid\"}"))
                .andExpect(status().isOk()).andReturn().getResponse();
        assertThat(unknown.getContentAsString()).isEqualTo(known.getContentAsString()).isEmpty();
        String code=users.findById(a.getId()).orElseThrow().getRecoveryToken();
        String wrong=code.equals("000000")?"111111":"000000";
        for(int attempt=1;attempt<=3;attempt++) {
            mvc.perform(post("/auth/reset-password").contentType("application/json").content("{\"email\":\""+a.getEmail()+"\",\"token\":\""+wrong+"\",\"novaSenha\":\"Other-synthetic-password\"}"))
                    .andExpect(status().isBadRequest());
            User reloaded=users.findById(a.getId()).orElseThrow();
            assertThat(reloaded.getResetAttempts()).isEqualTo(attempt<3?attempt:0);
            assertThat(reloaded.getSenha()).isEqualTo("synthetic-hash");
        }
        assertThat(users.findById(a.getId()).orElseThrow().getRecoveryToken()).isNull();
        org.mockito.Mockito.verify(emailService,org.mockito.Mockito.times(1)).sendTemplatedEmail(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString());
    }

    @ParameterizedTest @ValueSource(strings={"UTC", "America/Sao_Paulo", "Pacific/Kiritimati"})
    void independentGoalWritersPersistProductClockAfterReload(String runtimeZone) throws Exception {
        TimeZone previous = TimeZone.getDefault();
        try {
            // Application startup normalizes the JVM default to Sao Paulo. Change it
            // after startup so this probe really exercises the three default zones.
            TimeZone.setDefault(TimeZone.getTimeZone(runtimeZone));
            String numeric = create("/goals", "{\"title\":\"Clock independente\",\"targetValue\":10,\"deadline\":\"2027-01-01\",\"type\":\"NUMERIC\"}", tokenA);
            mvc.perform(post("/goals/"+numeric+"/deposit").header("Authorization", "Bearer "+tokenA)
                    .contentType("application/json").content("{\"amount\":1}"))
                    .andExpect(status().isOk());
            assertThat(sql.queryForObject("select date from goal_history where goal_id=?::uuid", java.time.LocalDateTime.class,
                    numeric)).isEqualTo(java.time.LocalDateTime.parse("2026-09-30T12:00:00"));
            mvc.perform(put(resolve("/goals/{goalA}/allocations")).header("Authorization", "Bearer "+tokenA)
                    .contentType("application/json").content(resolve("{\"accountId\":\"{accountA}\",\"amount\":\"10\"}")))
                    .andExpect(status().isNoContent());
            assertThat(sql.queryForObject("select date from goal_history where goal_id=?::uuid", java.time.LocalDateTime.class,
                    ids.get("goalA"))).isEqualTo(java.time.LocalDateTime.parse("2026-09-30T12:00:00"));
            assertThat(sql.queryForObject("select current_value from goals where id=?::uuid", java.math.BigDecimal.class,
                    ids.get("goalA"))).isEqualByComparingTo("10");
        } finally { TimeZone.setDefault(previous); }
    }

    @Test void independentRealizationForeignAndMissingAreUniformAndDoNotWrite() throws Exception {
        foreignUuidIs404AndCannotChangeEitherUser(new Case("POST", "/transactions/{transactionB}/realizations",
                "{\"operationId\":\"{command}\",\"date\":\"2026-09-30\",\"reason\":\"Revisão independente\"}"));
    }

    @ParameterizedTest @ValueSource(strings={"goal", "allocation", "account", "investment"})
    void independentAllocationMoveRejectsEveryForeignReferenceBeforeWriting(String reference) throws Exception {
        for (String owner : List.of("A", "B")) {
            mvc.perform(put(resolve("/goals/{goal"+owner+"}/allocations"))
                    .header("Authorization", "Bearer "+(owner.equals("A") ? tokenA : tokenB))
                    .contentType("application/json")
                    .content(resolve("{\"accountId\":\"{account"+owner+"}\",\"amount\":\"10\"}")))
                    .andExpect(status().isNoContent());
            ids.put("allocation"+owner, sql.queryForObject("select id::text from goal_allocations where goal_id=?::uuid",
                    String.class, ids.get("goal"+owner)));
        }
        String goal = reference.equals("goal") ? "{goalB}" : "{goalA}";
        String source = reference.equals("allocation") ? "{allocationB}" : "{allocationA}";
        String destinationAccount = "{accountB}";
        if (reference.equals("goal") || reference.equals("allocation")) {
            destinationAccount = create("/accounts", "{\"name\":\"OWN-DESTINATION\",\"type\":\"CHECKING\",\"initialBalance\":500,\"openingDate\":\"2026-09-01\"}", tokenA);
        }
        String destination = reference.equals("investment") ? "\"investmentId\":\"{investmentB}\"" :
                "\"accountId\":\""+destinationAccount+"\"";
        foreignUuidIs404AndCannotChangeEitherUser(new Case("POST", "/goals/"+goal+"/allocations/move",
                "{\"sourceAllocationId\":\""+source+"\","+destination+",\"amount\":\"5\"}"));
    }

    @Test void independentNoteAndCopyPreviousUsePrincipalInsteadOfInjectedOwner() throws Exception {
        mvc.perform(post("/annual-summary/note").header("Authorization", "Bearer "+tokenB)
                .contentType("application/json").content("{\"year\":2026,\"month\":9,\"content\":\"PRIVATE-NOTE-B\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/annual-summary/note").header("Authorization", "Bearer "+tokenA)
                .contentType("application/json").content(resolve("{\"year\":2026,\"month\":9,\"content\":\"PRIVATE-NOTE-A\",\"userId\":\"{userB}\"}")))
                .andExpect(status().isOk());
        for (String owner : List.of("A", "B")) {
            var response = mvc.perform(get("/annual-summary?year=2026")
                    .header("Authorization", "Bearer "+(owner.equals("A") ? tokenA : tokenB)))
                    .andExpect(status().isOk()).andReturn().getResponse();
            assertThat(response.getContentAsString()).contains("PRIVATE-NOTE-"+owner)
                    .doesNotContain("PRIVATE-NOTE-"+(owner.equals("A") ? "B" : "A"));
        }
        mvc.perform(post("/planning/copy-previous").header("Authorization", "Bearer "+tokenA)
                .contentType("application/json").content(resolve("{\"month\":10,\"year\":2026,\"userId\":\"{userB}\"}")))
                .andExpect(status().isOk());
        assertThat(sql.queryForObject("select count(*) from monthly_plans where user_id=?::uuid and month=10 and year=2026",
                Integer.class, ids.get("userA"))).isEqualTo(1);
        assertThat(sql.queryForObject("select count(*) from monthly_plans where user_id=?::uuid and month=10 and year=2026",
                Integer.class, ids.get("userB"))).isZero();
        assertThat(sql.queryForObject("select balance from accounts where id=?::uuid", java.math.BigDecimal.class,
                ids.get("accountB"))).isEqualByComparingTo("2300");
    }

    String resolve(String text) { for(var entry:ids.entrySet()) text=text.replace("{"+entry.getKey()+"}",entry.getValue()); return text; }
    String resolveMissing(String text) { for(var entry:ids.entrySet()) text=text.replace("{"+entry.getKey()+"}",entry.getKey().endsWith("B")?UUID.randomUUID().toString():entry.getValue()); return text; }
    String create(String path,String body,String token) throws Exception {
        var response=mvc.perform(post(path).header("Authorization","Bearer "+token).contentType("application/json").content(body))
                .andExpect(status().is2xxSuccessful()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("id").asText();
    }
    Map<String,String> snapshot() {
        Map<String,String> result=new TreeMap<>();
        // Independent raw rows, including versions and relationships; no ORM cache.
        for(String table:sql.queryForList("select tablename from pg_tables where schemaname=current_schema() and tablename not in ('flyway_schema_history','shedlock') order by tablename",String.class))
            result.put(table,sql.queryForObject("select md5(coalesce(jsonb_agg(row_value order by row_value::text),'[]'::jsonb)::text) from (select to_jsonb(t) row_value from \""+table+"\" t) rows",String.class));
        return result;
    }
    @AfterEach void clearIsolatedFixtures() {
        var tables=sql.queryForList("select tablename from pg_tables where schemaname=current_schema() and tablename not in ('flyway_schema_history','shedlock')",String.class);
        sql.execute("truncate " + tables.stream().map(t -> "\""+t+"\"").collect(java.util.stream.Collectors.joining(",")) + " cascade");
    }
}
