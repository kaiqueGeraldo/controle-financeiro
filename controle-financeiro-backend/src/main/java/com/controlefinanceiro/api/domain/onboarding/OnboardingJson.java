package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Canonical v1 JSON, never passes a financial token through floating point. */
public final class OnboardingJson {
    public static final JsonMapper JSON=JsonMapper.builder()
            .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS).build();
    private OnboardingJson() {}
    public static ObjectNode object() {return JSON.createObjectNode();}
    public static ObjectNode node(Object... pairs) {
        ObjectNode n=object();
        for(int i=0;i<pairs.length;i+=2) n.set(pairs[i].toString(),JSON.valueToTree(pairs[i+1]));
        return n;
    }
    public static JsonNode canonical(JsonNode n) {
        if(n.isObject()) {
            ObjectNode out=object();new TreeSet<>(n.propertyNames()).forEach(k->out.set(k,canonical(n.get(k))));return out;
        }
        if(n.isArray()) {
            List<JsonNode> rows=new ArrayList<>();n.forEach(x->rows.add(canonical(x)));
            if(!rows.isEmpty() && rows.getFirst().isObject()) rows.sort(Comparator.comparing(OnboardingJson::identity));
            else if(rows.stream().allMatch(JsonNode::isTextual)) rows.sort(Comparator.comparing(JsonNode::asText));
            return JSON.valueToTree(rows);
        }
        return n.deepCopy();
    }
    private static String identity(JsonNode n) {
        for(String key:List.of("tempId","reservationId","dimension")) if(n.has(key)) return n.get(key).asText();
        if(n.has("kind") && n.has("id"))return n.path("kind").asText()+":"+n.path("id").asText();
        if(n.has("id"))return n.path("id").asText();
        for(String key:List.of("source","ref")) if(n.has(key)) {
            JsonNode ref=n.get(key);return ref.path("kind").asText()+":"+ref.path(ref.has("id")?"id":"tempId").asText();
        }
        return n.toString();
    }
    public static String hash(JsonNode n) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical(n).toString().getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}
    }
    public static BigDecimal decimal(JsonNode n) {return n==null || n.isNull() || n.isMissingNode()?null:new BigDecimal(n.asText());}
    public static BigDecimal fact(JsonNode n) {return n.path("state").asText().equals("KNOWN")?decimal(n.get("value")):null;}
    public static JsonNode fact(BigDecimal n,int scale) {return n==null?node("state","UNKNOWN"):node("state","KNOWN","value",n.setScale(scale).toPlainString());}
}
