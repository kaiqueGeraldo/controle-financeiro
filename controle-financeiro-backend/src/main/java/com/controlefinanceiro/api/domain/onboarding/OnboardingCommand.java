package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.DraftProblem.invalid;

/** Small closed command envelopes. Financial payload can only come from saved draft. */
public record OnboardingCommand(UUID sessionId,long expectedVersion,UUID operationId,String contentHash,String reviewHash) {
    public static OnboardingCommand parse(byte[] body,String action,UUID pathOperation) {
        if(body.length>4096) throw new DraftProblem(413,"BODY_LIMIT");
        JsonNode n;
        try {n=JsonMapper.builder().enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
                .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build().readTree(body);}
        catch(RuntimeException e){throw invalid("","JSON_INVALID");}
        Set<String> fields=new HashSet<>(List.of("sessionId","expectedVersion"));
        if(!action.equals("cancel")) fields.addAll(List.of("contractVersion","operationId"));
        if(action.equals("complete")) fields.addAll(List.of("contentHash","reviewHash","confirm"));
        if(!n.isObject() || !n.propertyNames().equals(fields)) throw invalid("","INVALID_COMMAND");
        if(!action.equals("cancel") && (!n.path("contractVersion").isIntegralNumber() || n.path("contractVersion").intValue()!=1)) throw invalid("/contractVersion","INVALID_COMMAND");
        String v=n.path("expectedVersion").asText();
        if(!n.path("expectedVersion").isTextual() || !v.matches("0|[1-9][0-9]{0,18}")) throw invalid("/expectedVersion","REVISION_INVALID");
        long revision;try {revision=Long.parseLong(v);}catch(NumberFormatException e){throw invalid("/expectedVersion","REVISION_INVALID");}
        if(action.equals("complete")) {
            if(!n.path("confirm").isBoolean() || !n.path("confirm").booleanValue()) throw invalid("/confirm","CONFIRMATION_REQUIRED");
            for(String h:List.of("contentHash","reviewHash")) if(!n.path(h).isTextual() || !n.path(h).asText().matches("[0-9a-f]{64}")) throw invalid("/"+h,"HASH_INVALID");
        }
        return new OnboardingCommand(uuid(n.path("sessionId"),"/sessionId"),revision,
                pathOperation==null?uuid(n.path("operationId"),"/operationId"):pathOperation,
                n.path("contentHash").asText(null),n.path("reviewHash").asText(null));
    }
    public static UUID uuid(JsonNode n,String path) {
        if(!n.isTextual() || !n.asText().matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) throw invalid(path,"UUID_INVALID");
        return UUID.fromString(n.asText());
    }
}
