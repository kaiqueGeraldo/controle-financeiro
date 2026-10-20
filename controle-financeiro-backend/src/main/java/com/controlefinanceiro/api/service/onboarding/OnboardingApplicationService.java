package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.onboarding.*;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.service.FinancialInventoryGuard;
import com.controlefinanceiro.api.service.intent.FinancialIntents;
import jakarta.persistence.EntityManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

/** One local transaction owns the financial effects, receipt and terminal state.
 * PREPARED is durable coordination, never a promise that a commit did not happen. */
@Service
public class OnboardingApplicationService {
    private final FinancialIntents intents;private final FinancialInventoryGuard guard;
    private final EntityManager em;private final JdbcTemplate jdbc;
    private final OnboardingSessionRepository sessions;private final DraftReferences references;
    private final OnboardingInventory inventory;private final OnboardingOpenings openings;
    private final Clock clock;private final ApplicationEventPublisher events;
    private final OnboardingReservationRegistry reservations;
    public OnboardingApplicationService(FinancialIntents intents,FinancialInventoryGuard guard,EntityManager em,JdbcTemplate jdbc,
            OnboardingSessionRepository sessions,DraftReferences references,OnboardingInventory inventory,OnboardingOpenings openings,Clock clock,ApplicationEventPublisher events,OnboardingReservationRegistry reservations) {
        this.intents=intents;this.guard=guard;this.em=em;this.jdbc=jdbc;this.sessions=sessions;this.references=references;this.inventory=inventory;this.openings=openings;this.clock=clock;this.events=events;this.reservations=reservations;
    }
    @Transactional
    public JsonNode prepare(UUID owner,OnboardingCommand command) {
        Instant now=now();intents.lock(command.operationId());
        var old=find(command.operationId(),null);
        if(old!=null) {
            samePreparation(old,owner,command);
            if(old.getState().equals("CANCELLED"))throw new DraftProblem(409,"INTENT_CANCELLED");
            return JSON.readTree(old.getPreparedJson());
        }
        // Shared namespace: a committed transaction/investment key cannot become onboarding.
        replay(owner,command,"prepare-identity-check");
        guard.snapshot(owner);OnboardingSession session=lockSession(owner,command);
        if(!session.getStatus().equals("IN_PROGRESS") || session.getPayload()==null)throw new DraftProblem(409,"VERSION_CONFLICT");
        if(pending(session.getId())!=null)throw new DraftProblem(409,"INTENT_PENDING");
        JsonNode payload=validate(owner,session,now);
        var snapshot=inventory.load(owner,categories(payload));
        if(reservations.materialize(owner,snapshot,payload,now))snapshot=inventory.load(owner,categories(payload));
        var projection=new OnboardingProjection(payload,snapshot,now,inventory.maxRelations());
        String content=contentHash(session,payload);
        ObjectNode review=node("contentHash",content,"sourceSnapshot",projection.sourceSnapshot(),"summary",projection.summary(),"mappingPreview",canonical(JSON.valueToTree(projection.mappingPreview)));
        String reviewHash=reviewHash(review);
        JsonNode prepared=canonical(node("contractVersion",1,"operationId",command.operationId().toString(),"kind",FinancialIntents.ONBOARDING_COMPLETE,
                "sessionId",session.getId().toString(),"draftVersion",Long.toString(session.getVersion()),"contentHash",content,"reviewHash",reviewHash,
                "sourceSnapshot",review.get("sourceSnapshot"),"summary",review.get("summary"),"mappingPreview",review.get("mappingPreview"),"preparedAt",now.toString()));
        inventory.check(prepared);
        var p=new OnboardingPreparation();p.setOperationId(command.operationId());p.setUserId(owner);p.setSessionId(session.getId());p.setDraftVersion(session.getVersion());
        p.setState("PREPARED");p.setContentHash(content);p.setPreparedJson(prepared.toString());p.setPreparedAt(now);em.persist(p);em.flush();return prepared;
    }
    @Transactional
    public JsonNode complete(UUID owner,OnboardingCommand command) {
        Instant now=now();String fingerprint=fingerprint(owner,command);
        JsonNode previous=replay(owner,command,fingerprint);if(previous!=null)return previous;
        var prepared=find(command.operationId(),owner);if(prepared==null)throw new DraftProblem(404,"REFERENCE_NOT_FOUND");samePreparation(prepared,owner,command);
        if(prepared.getState().equals("CANCELLED"))throw new DraftProblem(409,"INTENT_CANCELLED");
        JsonNode frozen=JSON.readTree(prepared.getPreparedJson());
        if(!frozen.path("contentHash").asText().equals(command.contentHash()) || !frozen.path("reviewHash").asText().equals(command.reviewHash()))throw new DraftProblem(409,"INTENT_CONTENT_CONFLICT");
        guard.snapshot(owner);var session=lockSession(owner,command);
        references.validate(owner,savedWrite(session)); // 404 ownership/existence precedes freshness diagnostics.
        var current=inventory.load(owner,categories(JSON.readTree(session.getPayload())));
        if(!current.token().equals(frozen.at("/sourceSnapshot/inventoryToken").asText()))throw new DraftProblem(409,"SOURCE_CHANGED");
        JsonNode payload=validate(owner,session,now);
        if(!contentHash(session,payload).equals(command.contentHash()))throw new DraftProblem(409,"INTENT_CONTENT_CONFLICT");
        var projection=new OnboardingProjection(payload,current,Instant.parse(frozen.at("/summary/existingAsOf").asText()),inventory.maxRelations());
        var review=node("contentHash",command.contentHash(),"sourceSnapshot",projection.sourceSnapshot(),"summary",projection.summary(),"mappingPreview",canonical(JSON.valueToTree(projection.mappingPreview)));
        if(!reviewHash(review).equals(command.reviewHash()))throw new DraftProblem(409,"SOURCE_CHANGED");
        List<JsonNode> mapping=openings.apply(owner,session.getId(),projection,now);
        JsonNode receipt=canonical(node("contractVersion",1,"operationId",command.operationId().toString(),"kind",FinancialIntents.ONBOARDING_COMPLETE,
                "sessionId",session.getId().toString(),"draftVersion",Long.toString(prepared.getDraftVersion()),"contentHash",command.contentHash(),"reviewHash",command.reviewHash(),
                "status","COMPLETED","completedAt",now.toString(),"mapping",mapping,"summary",frozen.get("summary")));
        inventory.check(receipt);
        intents.complete(command.operationId(),owner,FinancialIntents.ONBOARDING_COMPLETE,fingerprint,receipt);
        session.setVersion(next(session.getVersion()));session.setStatus("COMPLETED");session.setUpdatedAt(now);sessions.saveAndFlush(session);
        prepared.setState("COMPLETED");em.flush();
        Set<Integer> years=new TreeSet<>(List.of(projection.baseDate.getYear(),LocalDate.ofInstant(now,clock.getZone()).getYear()));
        for(JsonNode f:projection.items("forecasts"))years.add(LocalDate.parse(f.path("dueDate").asText()).getYear());
        years.forEach(year->events.publishEvent(new UserFinancialDataChangedEvent(owner,year)));
        return receipt;
    }
    @Transactional
    public JsonNode cancel(UUID owner,OnboardingCommand command) {
        Instant now=now();intents.lock(command.operationId());var p=find(command.operationId(),owner);
        if(p==null || !p.getSessionId().equals(command.sessionId()))throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
        if(p.getState().equals("CANCELLED")) {
            if(command.expectedVersion()!=p.getDraftVersion())throw new DraftProblem(409,"INTENT_CONTENT_CONFLICT");
            return operation(p,owner);
        }
        if(p.getState().equals("COMPLETED"))throw new DraftProblem(409,"ALREADY_COMPLETED");
        guard.snapshot(owner);var s=lockSession(owner,command);s.setVersion(next(s.getVersion()));s.setUpdatedAt(now);p.setState("CANCELLED");p.setCancelledVersion(s.getVersion());em.flush();return operation(p,owner);
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public JsonNode recover(UUID owner,UUID operation) {
        var p=find(operation,owner);if(p==null)throw new DraftProblem(404,"REFERENCE_NOT_FOUND");return operation(p,owner);
    }
    public JsonNode pending(UUID session) {
        var rows=em.createQuery("select p from OnboardingPreparation p where p.sessionId=:session and p.state='PREPARED'",OnboardingPreparation.class).setParameter("session",session).getResultList();
        return rows.isEmpty()?null:JSON.readTree(rows.getFirst().getPreparedJson());
    }
    public JsonNode completed(UUID owner,UUID session) {
        var rows=em.createQuery("select p from OnboardingPreparation p where p.sessionId=:session and p.userId=:owner and p.state='COMPLETED'",OnboardingPreparation.class).setParameter("session",session).setParameter("owner",owner).getResultList();
        return rows.isEmpty()?null:intents.recover(rows.getFirst().getOperationId(),owner).result();
    }
    private JsonNode operation(OnboardingPreparation p,UUID owner) {
        return node("contractVersion",1,"operationId",p.getOperationId().toString(),"kind",FinancialIntents.ONBOARDING_COMPLETE,"sessionId",p.getSessionId().toString(),"state",p.getState(),"prepared",JSON.readTree(p.getPreparedJson()),"receipt",p.getState().equals("COMPLETED")?intents.recover(p.getOperationId(),owner).result():null);
    }
    private JsonNode replay(UUID owner,OnboardingCommand c,String fingerprint) {
        try{return intents.replay(c.operationId(),owner,FinancialIntents.ONBOARDING_COMPLETE,fingerprint,JsonNode.class);}
        catch(com.controlefinanceiro.api.service.exception.OperationConflictException e){throw new DraftProblem(409,"INTENT_CONTENT_CONFLICT");}
    }
    private OnboardingPreparation find(UUID operation,UUID owner) {
        var p=em.find(OnboardingPreparation.class,operation);return p==null || owner!=null&&!owner.equals(p.getUserId())?null:p;
    }
    private void samePreparation(OnboardingPreparation p,UUID owner,OnboardingCommand c) {
        if(!p.getUserId().equals(owner) || !p.getSessionId().equals(c.sessionId()) || p.getDraftVersion()!=c.expectedVersion())throw new DraftProblem(409,"INTENT_CONTENT_CONFLICT");
    }
    private OnboardingSession lockSession(UUID owner,OnboardingCommand c) {
        if(em.createNativeQuery("select id from users where id=?1 for update").setParameter(1,owner).getResultList().isEmpty())throw new DraftProblem(401,"UNAUTHENTICATED");
        var s=sessions.findByUserId(owner).filter(x->x.getId().equals(c.sessionId())).orElseThrow(()->new DraftProblem(404,"REFERENCE_NOT_FOUND"));
        if(s.getStatus().equals("COMPLETED"))throw new DraftProblem(409,"ALREADY_COMPLETED");
        if(s.getVersion()!=c.expectedVersion() || s.getVersion()==Long.MAX_VALUE)throw new DraftProblem(409,"VERSION_CONFLICT");return s;
    }
    private JsonNode validate(UUID owner,OnboardingSession s,Instant now) {
        var write=savedWrite(s);
        List<DraftProblem.FieldError> issues=new ArrayList<>(write.issues());issues.addAll(references.validate(owner,write));
        issues.addAll(OnboardingFinalRules.issues(write.payload()));
        if(write.payload().path("context").has("baseDate") && LocalDate.parse(write.payload().at("/context/baseDate").asText()).isAfter(LocalDate.ofInstant(now,clock.getZone())))issues.add(DraftProblem.issue("/context/baseDate","AFTER_TODAY"));
        if(!write.payload().path("currentStep").asText().equals("REVIEW"))issues.add(DraftProblem.issue("/currentStep","REVIEW_REQUIRED"));
        if(!issues.isEmpty())throw new DraftProblem(400,"BUSINESS_RULE",issues);return write.payload();
    }
    private static String contentHash(OnboardingSession s,JsonNode payload) {return hash(node("contractVersion",1,"sessionId",s.getId().toString(),"draftVersion",Long.toString(s.getVersion()),"payload",payload));}
    private static DraftValidator.Write savedWrite(OnboardingSession s) {return DraftValidator.parse(node("contractVersion",1,"expectedVersion",Long.toString(s.getVersion()),"action","SAVE","payload",JSON.readTree(s.getPayload())).toString().getBytes(StandardCharsets.UTF_8));}
    private static Set<UUID> categories(JsonNode payload) {Set<UUID> ids=new HashSet<>();for(JsonNode f:payload.at("/sections/forecasts/items"))if(f.at("/category/id").isTextual())ids.add(UUID.fromString(f.at("/category/id").asText()));return ids;}
    private static String reviewHash(JsonNode review) {ObjectNode n=(ObjectNode)review.deepCopy();((ObjectNode)n.get("summary")).remove("existingAsOf");return hash(n);}
    private static String fingerprint(UUID owner,OnboardingCommand c) {return hash(node("owner",owner.toString(),"kind",FinancialIntents.ONBOARDING_COMPLETE,"operationId",c.operationId().toString(),"sessionId",c.sessionId().toString(),"draftVersion",Long.toString(c.expectedVersion()),"contentHash",c.contentHash(),"reviewHash",c.reviewHash()));}
    private Instant now() {return clock.instant().truncatedTo(ChronoUnit.MICROS);}
    private static long next(long n) {if(n==Long.MAX_VALUE)throw new DraftProblem(409,"VERSION_CONFLICT");return n+1;}
}
