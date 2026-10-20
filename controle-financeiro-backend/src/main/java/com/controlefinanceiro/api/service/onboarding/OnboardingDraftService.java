package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.onboarding.*;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class OnboardingDraftService {
    public record SessionView(int contractVersion,UUID sessionId,String version,String status,String mode,
                              JsonNode payload,JsonNode issues,Instant updatedAt,Object pendingIntent,Object completedReceipt) {}
    private final OnboardingSessionRepository sessions;
    private final EntityManager em;
    private final DraftReferences references;
    private final JsonMapper json;
    private final Clock clock;
    private final OnboardingApplicationService application;
    public OnboardingDraftService(OnboardingSessionRepository sessions,EntityManager em,DraftReferences references,JsonMapper json,Clock clock,OnboardingApplicationService application) {
        this.sessions=sessions;this.em=em;this.references=references;this.json=json;this.clock=clock;this.application=application;
    }
    @Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public SessionView get(UUID owner) {
        return view(owner,sessions.findByUserId(owner).orElse(null));
    }
    @Transactional
    public SessionView save(UUID owner,DraftValidator.Write write) {
        Instant now=clock.instant().truncatedTo(ChronoUnit.MICROS);
        // Same first lock as user deletion; no source locks and no financial writes.
        em.createNativeQuery("SET LOCAL lock_timeout = '5s'").executeUpdate();
        if(em.createNativeQuery("select id from users where id=:owner for update").setParameter("owner",owner).getResultList().isEmpty())
            throw new DraftProblem(401,"UNAUTHENTICATED");
        var session=sessions.findByUserId(owner).orElse(null);
        long current=session==null?0:session.getVersion();
        if(current!=write.expectedVersion()) throw new DraftProblem(409,"VERSION_CONFLICT");
        if(session!=null && session.getStatus().equals("COMPLETED")) throw new DraftProblem(409,"ALREADY_COMPLETED");
        if(session!=null && application.pending(session.getId())!=null) throw new DraftProblem(409,"INTENT_PENDING");
        if(current==Long.MAX_VALUE) throw new DraftProblem(409,"VERSION_CONFLICT");
        var issues=new java.util.ArrayList<>(write.issues());
        issues.addAll(references.validate(owner,write));
        boolean staysPaused=session!=null && session.getStatus().equals("SKIPPED")
                && session.getPayload()!=null && write.action().equals("SAVE");
        if(session==null) {session=new OnboardingSession();session.setId(UUID.randomUUID());session.setUserId(owner);}
        session.setVersion(current+1);
        session.setStatus(staysPaused || write.action().equals("PAUSE") || write.action().equals("DISCARD")?"SKIPPED":"IN_PROGRESS");
        session.setPayload(write.payload()==null?null:json.writeValueAsString(write.payload()));
        session.setIssues(json.writeValueAsString(issues));session.setUpdatedAt(now);
        sessions.saveAndFlush(session);
        return view(owner,session);
    }
    private SessionView view(UUID owner,OnboardingSession session) {
        if(session==null) return new SessionView(1,null,"0","NOT_STARTED",references.mode(owner),null,json.createArrayNode(),null,null,null);
        return new SessionView(1,session.getId(),Long.toString(session.getVersion()),session.getStatus(),references.mode(owner),
                session.getPayload()==null?null:json.readTree(session.getPayload()),json.readTree(session.getIssues()),session.getUpdatedAt(),application.pending(session.getId()),application.completed(owner,session.getId()));
    }
}
