package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.DraftProblem.*;

/** SPEC-001 write schema. Missing leaves are issues; malformed supplied values are errors.
 * No financial calculation, historical inference or mutation of domain positions occurs here. */
public final class DraftValidator {
    public static final int MAX_BYTES = 256 * 1024;
    private static final JsonMapper JSON = JsonMapper.builder()
            .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
            .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build();
    private static final Map<String,Integer> LIMITS = Map.of("accounts",50,"cards",20,
            "investments",50,"goals",100,"allocations",200,"forecasts",120);
    public record Reference(String kind, UUID id, String tempId, String path) {}
    public record Confirmation(UUID id, long revision, String path) {}
    public record Write(long expectedVersion, String action, JsonNode payload,
                        List<FieldError> issues, List<Reference> references, List<Confirmation> confirmations) {}
    private final List<FieldError> issues = new ArrayList<>();
    private final List<Reference> refs = new ArrayList<>();
    private final List<Confirmation> confirmations = new ArrayList<>();
    private final Map<String,String> temporary = new HashMap<>();
    private final Set<String> persisted = new HashSet<>();
    private int installments;

    public static Write parse(byte[] bytes) {
        if (bytes.length > MAX_BYTES) throw new DraftProblem(413,"BODY_LIMIT");
        JsonNode root;
        try { root = JSON.readTree(bytes); }
        catch (RuntimeException ex) { throw invalid("", "JSON_INVALID"); }
        return new DraftValidator().validate(root);
    }
    private Write validate(JsonNode root) {
        depth(root,0);
        object(root,"","contractVersion expectedVersion action payload");
        integer(required(root,"contractVersion",""),"/contractVersion",1,1);
        long version = revision(required(root,"expectedVersion",""),"/expectedVersion");
        String action = enumeration(required(root,"action",""),"/action","SAVE PAUSE RESUME DISCARD");
        if (action.equals("DISCARD")) {
            if (root.has("payload")) throw invalid("/payload","FIELD_NOT_ALLOWED");
            return new Write(version,action,null,List.of(),List.of(),List.of());
        }
        JsonNode payload = required(root,"payload","");
        object(payload,"","context currentStep sections reservationConfirmations");
        enumeration(required(payload,"currentStep",""),"/currentStep",
                "CONTEXT ACCOUNTS CARDS INVESTMENTS GOALS ALLOCATIONS FORECASTS REVIEW");
        JsonNode context = required(payload,"context","");
        object(context,"/context","currency baseDate preferredName objective browserZone boundaryAcknowledged cashOnlyAcknowledged");
        leaf(context,"currency","/context",n -> enumeration(n,"/context/currency","BRL"));
        leaf(context,"baseDate","/context",n -> date(n,"/context/baseDate"));
        text(context,"preferredName","/context",80,false);
        text(context,"objective","/context",200,false);
        if (context.has("browserZone")) {
            text(context,"browserZone","/context",80,false);
            if (!ZoneId.getAvailableZoneIds().contains(context.get("browserZone").asText("")))
                throw invalid("/context/browserZone","ZONE_INVALID");
        }
        bool(context,"boundaryAcknowledged","/context",true);
        bool(context,"cashOnlyAcknowledged","/context",true);
        JsonNode sections = required(payload,"sections","");
        object(sections,"/sections",String.join(" ",LIMITS.keySet()));
        for (String name : new TreeSet<>(LIMITS.keySet())) section(name,required(sections,name,"/sections"));
        if (payload.has("reservationConfirmations")) reservationConfirmations(payload.get("reservationConfirmations"));
        if (installments > 600 || temporary.size() > 1200) throw invalid("/sections","ITEM_LIMIT");
        for (Reference ref : refs) if (ref.tempId()!=null) {
            String kind = temporary.get(ref.tempId());
            if (kind == null) issues.add(issue(ref.path(),"REFERENCE_PENDING"));
            else if (!kind.equals(ref.kind())) throw invalid(ref.path(),"REFERENCE_TYPE");
        }
        issues.addAll(DraftConsistency.issues(payload));
        return new Write(version,action,payload,List.copyOf(issues),List.copyOf(refs),List.copyOf(confirmations));
    }
    private void section(String name, JsonNode section) {
        String p="/sections/"+name;
        object(section,p,"answer items");
        String answer=enumeration(required(section,"answer",p),p+"/answer","UNANSWERED NONE PROVIDED DEFERRED");
        JsonNode items=required(section,"items",p); array(items,p+"/items",LIMITS.get(name));
        if ((answer.equals("NONE") || answer.equals("DEFERRED")) && !items.isEmpty())
            issues.add(issue(p+"/items","ANSWER_ITEMS_CONFLICT"));
        if (answer.equals("PROVIDED") && items.isEmpty()) issues.add(issue(p+"/items","REQUIRED"));
        if (answer.equals("UNANSWERED")) issues.add(issue(p+"/answer","REQUIRED"));
        if (name.equals("accounts") && answer.equals("DEFERRED")) issues.add(issue(p+"/answer","ANSWER_INVALID"));
        for (int i=0;i<items.size();i++) item(name,items.get(i),p+"/items/"+i);
    }
    private void item(String section, JsonNode n, String p) {
        if (!n.isObject()) throw invalid(p,"OBJECT_REQUIRED");
        String kind=switch(section) {case "accounts"->"ACCOUNT";case "investments"->"INVESTMENT";
            case "cards"->"CARD";case "goals"->"GOAL";case "allocations"->"ALLOCATION";default->"FORECAST";};
        temp(n,p,kind);
        if (section.equals("allocations")) {
            object(n,p,"tempId goal source amount");
            refLeaf(n,"goal",p,"GOAL",false); refLeaf(n,"source",p,"ACCOUNT INVESTMENT",false);
            money(n,"amount",p,false,false); return;
        }
        if (section.equals("forecasts")) {
            object(n,p,"tempId description direction amount dueDate account category recurrenceLabel");
            text(n,"description",p,200,true); enumLeaf(n,"direction",p,"INCOME EXPENSE");
            money(n,"amount",p,false,true); dateLeaf(n,"dueDate",p);
            refLeaf(n,"account",p,"ACCOUNT",false);
            leaf(n,"category",p,c -> {
                object(c,p+"/category","id");
                refs.add(new Reference("CATEGORY",uuid(required(c,"id",p+"/category"),p+"/category/id"),null,p+"/category"));
            }); text(n,"recurrenceLabel",p,100,false); return;
        }
        String choices="CREATE LINK"+(kind.equals("ACCOUNT")?" INITIALIZE_DEFAULT":kind.equals("CARD")?" INITIALIZE_EMPTY":"");
        String action=enumeration(required(n,"action",p),p+"/action",choices);
        if (action.equals("LINK")) {
            object(n,p,"tempId action ref"); refLeaf(n,"ref",p,kind,true);
            uniquePersisted(n,p,kind); return;
        }
        if (action.startsWith("INITIALIZE")) {
            object(n,p,kind.equals("ACCOUNT")?"tempId action ref balance deficitAcknowledged":"tempId action ref opening");
            refLeaf(n,"ref",p,kind,true); uniquePersisted(n,p,kind);
            if (kind.equals("ACCOUNT")) { fact(n,"balance",p,"MONEY_SIGNED","KNOWN UNKNOWN"); bool(n,"deficitAcknowledged",p,true); }
            else leaf(n,"opening",p,v -> opening(v,p+"/opening"));
            return;
        }
        switch(kind) {
            case "ACCOUNT" -> {
                object(n,p,"tempId action name type balance color deficitAcknowledged distinctCashConfirmed");
                text(n,"name",p,100,true); enumLeaf(n,"type",p,"CHECKING INVESTMENT CASH SAVINGS");
                fact(n,"balance",p,"MONEY_SIGNED","KNOWN UNKNOWN");
                bool(n,"deficitAcknowledged",p,true); bool(n,"distinctCashConfirmed",p,true);
                if (n.has("color") && (!n.get("color").isTextual() || !n.get("color").asText("").matches("#[0-9A-Fa-f]{6}")))
                    throw invalid(p+"/color","COLOR_INVALID");
            }
            case "INVESTMENT" -> {
                object(n,p,"tempId action name type identifier institution positionMode quantity cost valuation acquisitionDate historicalSource");
                text(n,"name",p,100,true); enumLeaf(n,"type",p,"STOCK FII FIXED_INCOME CRYPTO TREASURY OTHER");
                text(n,"identifier",p,40,false); text(n,"institution",p,100,false);
                String mode=enumeration(required(n,"positionMode",p),p+"/positionMode","UNIT MONETARY");
                fact(n,"quantity",p,"QUANTITY",mode.equals("UNIT")?"KNOWN UNKNOWN":"NOT_APPLICABLE");
                fact(n,"cost",p,"MONEY","KNOWN UNKNOWN");
                fact(n,"acquisitionDate",p,"DATE","KNOWN UNKNOWN"); fact(n,"historicalSource",p,"TEXT","KNOWN UNKNOWN");
                leaf(n,"valuation",p,v -> valuation(v,p+"/valuation"));
                if (mode.equals("MONETARY") && n.has("type") && !Set.of("FIXED_INCOME","TREASURY","OTHER").contains(n.get("type").asText("")))
                    issues.add(issue(p+"/type","POSITION_MODE_CONFLICT"));
                if (mode.equals("MONETARY") && n.path("valuation").path("basis").asText("").equals("PRICE"))
                    issues.add(issue(p+"/valuation/basis","POSITION_MODE_CONFLICT"));
                if (mode.equals("UNIT") && n.path("quantity").path("state").asText("").equals("KNOWN")
                        && n.path("quantity").has("value") && new BigDecimal(n.path("quantity").path("value").asText("")).signum()==0)
                    issues.add(issue(p+"/quantity/value","POSITIVE_REQUIRED"));
            }
            case "CARD" -> {
                object(n,p,"tempId action name last4Digits brand limit closingDay dueDay opening");
                text(n,"name",p,100,true); text(n,"brand",p,40,false);
                if(n.has("last4Digits") && (!n.get("last4Digits").isTextual() || !n.get("last4Digits").asText("").matches("[0-9]{4}")))
                    throw invalid(p+"/last4Digits","INVALID_FORMAT");
                fact(n,"limit",p,"MONEY","KNOWN UNKNOWN");
                leaf(n,"closingDay",p,v->integer(v,p+"/closingDay",1,31));
                leaf(n,"dueDay",p,v->integer(v,p+"/dueDay",1,31)); leaf(n,"opening",p,v->opening(v,p+"/opening"));
            }
            case "GOAL" -> {
                object(n,p,"tempId action title type target deadline unit initialProgress");
                String type=enumeration(required(n,"type",p),p+"/type","MONETARY NUMERIC");
                text(n,"title",p,100,true); dateLeaf(n,"deadline",p);
                decimalLeaf(n,"target",p,type.equals("NUMERIC")?8:2,false,true);
                if(type.equals("NUMERIC")) { text(n,"unit",p,30,true); decimalLeaf(n,"initialProgress",p,8,false,false); }
                else if(n.has("unit") || n.has("initialProgress")) throw invalid(p,"FIELD_NOT_ALLOWED");
            }
            default -> throw new IllegalStateException("Unsupported draft section");
        }
    }
    private void valuation(JsonNode n,String p) {
        if(!n.isObject()) throw invalid(p,"OBJECT_REQUIRED");
        String state=enumeration(required(n,"state",p),p+"/state","KNOWN UNKNOWN");
        if(state.equals("UNKNOWN")) {object(n,p,"state");return;}
        String basis=enumeration(required(n,"basis",p),p+"/basis","TOTAL PRICE");
        object(n,p,basis.equals("TOTAL")?"state basis amount date source note":"state basis price date source note");
        if(basis.equals("TOTAL")) money(n,"amount",p,false,false); else decimalLeaf(n,"price",p,8,false,false);
        dateLeaf(n,"date",p); enumLeaf(n,"source",p,"USER_DECLARED"); text(n,"note",p,200,false);
    }
    private void opening(JsonNode n,String p) {
        object(n,p,"currentCompetence currentOutstanding currentPrincipal currentCharges dueDateOverride credit creditNotNettedAcknowledged futureInstallments");
        leaf(n,"currentCompetence",p,v->competence(v,p+"/currentCompetence"));
        money(n,"currentOutstanding",p,false,false); money(n,"credit",p,false,false);
        fact(n,"currentPrincipal",p,"MONEY","KNOWN UNKNOWN"); fact(n,"currentCharges",p,"MONEY","KNOWN UNKNOWN");
        bool(n,"creditNotNettedAcknowledged",p,true); optionalDate(n,"dueDateOverride",p);
        JsonNode future=required(n,"futureInstallments",p); array(future,p+"/futureInstallments",120); installments+=future.size();
        for(int i=0;i<future.size();i++) {
            JsonNode row=future.get(i);String q=p+"/futureInstallments/"+i;
            object(row,q,"tempId competence amount principal charges description dueDateOverride"); temp(row,q,"INSTALLMENT");
            leaf(row,"competence",q,v->competence(v,q+"/competence")); money(row,"amount",q,false,true);
            fact(row,"principal",q,"MONEY","KNOWN UNKNOWN");fact(row,"charges",q,"MONEY","KNOWN UNKNOWN");
            text(row,"description",q,200,false);optionalDate(row,"dueDateOverride",q);
        }
    }
    private void reservationConfirmations(JsonNode list) {
        String p="/reservationConfirmations"; array(list,p,200); Set<UUID> seen=new HashSet<>();int parts=0;
        for(int i=0;i<list.size();i++) {
            JsonNode n=list.get(i);String q=p+"/"+i;
            if(!n.isObject()) throw invalid(q,"OBJECT_REQUIRED");
            UUID id=uuid(required(n,"reservationId",q),q+"/reservationId");
            if(!seen.add(id)) throw invalid(q,"DUPLICATE_REFERENCE");
            long revision=revision(required(n,"expectedRevision",q),q+"/expectedRevision");
            confirmations.add(new Confirmation(id,revision,q));
            String action=enumeration(required(n,"action",q),q+"/action","ASSIGN CLOSE");
            object(n,q,action.equals("CLOSE")?"reservationId expectedRevision action currentSituationConfirmed":
                    "reservationId expectedRevision action currentSituationConfirmed goal parts");
            bool(n,"currentSituationConfirmed",q,true);
            if(n.has("currentSituationConfirmed") && !n.get("currentSituationConfirmed").asBoolean(false)) issues.add(issue(q+"/currentSituationConfirmed","CONFIRMATION_REQUIRED"));
            if(action.equals("ASSIGN")) {
                refLeaf(n,"goal",q,"GOAL",false);
                JsonNode values=required(n,"parts",q);array(values,q+"/parts",200);parts+=values.size();
                if(values.isEmpty()) issues.add(issue(q+"/parts","REQUIRED"));
                Set<String> sources=new HashSet<>();
                for(int j=0;j<values.size();j++) {
                    JsonNode part=values.get(j);String r=q+"/parts/"+j;object(part,r,"source amount");
                    refLeaf(part,"source",r,"ACCOUNT INVESTMENT",false);money(part,"amount",r,false,true);
                    if(part.has("source") && !sources.add(part.get("source").toString())) throw invalid(r+"/source","DUPLICATE_REFERENCE");
                }
            }
        }
        if(parts>200) throw invalid(p,"ITEM_LIMIT");
    }
    private void uniquePersisted(JsonNode n,String p,String kind) {
        if(n.has("ref") && n.get("ref").has("id") && !persisted.add(kind+":"+n.get("ref").get("id").asText("")))
            throw invalid(p+"/ref","DUPLICATE_REFERENCE");
    }
    private void temp(JsonNode n,String p,String kind) {
        String id=uuid(required(n,"tempId",p),p+"/tempId").toString();
        if(temporary.putIfAbsent(id,kind)!=null) throw invalid(p+"/tempId","DUPLICATE_REFERENCE");
    }
    private void refLeaf(JsonNode n,String key,String p,String kinds,boolean persistent) {
        leaf(n,key,p,r->{String q=p+"/"+key;object(r,q,"kind id tempId");
            String kind=enumeration(required(r,"kind",q),q+"/kind",kinds);
            if(r.has("id")==r.has("tempId") || (persistent && !r.has("id"))) throw invalid(q,"REFERENCE_INVALID");
            if(r.has("id")) refs.add(new Reference(kind,uuid(r.get("id"),q+"/id"),null,q));
            else refs.add(new Reference(kind,null,uuid(r.get("tempId"),q+"/tempId").toString(),q));
        });
    }
    private void fact(JsonNode n,String key,String p,String type,String states) {
        leaf(n,key,p,f->{String q=p+"/"+key;
            if(!f.isObject()) throw invalid(q,"OBJECT_REQUIRED");
            String state=enumeration(required(f,"state",q),q+"/state",states);
            object(f,q,state.equals("KNOWN")?"state value":"state");
            if(state.equals("KNOWN")) leaf(f,"value",q,v->{switch(type) {
                case "MONEY", "MONEY_SIGNED", "QUANTITY" -> normalize(f,"value",v,q+"/value",type.equals("QUANTITY")?8:2,type.equals("MONEY_SIGNED"),false);
                case "DATE" -> date(v,q+"/value");
                default -> text(f,"value",q,200,true);
            }});
        });
    }
    private void competence(JsonNode n,String p) {
        object(n,p,"year month");integer(required(n,"year",p),p+"/year",1,9999);integer(required(n,"month",p),p+"/month",1,12);
    }
    private void money(JsonNode n,String key,String p,boolean signed,boolean positive) { decimalLeaf(n,key,p,2,signed,positive); }
    private void decimalLeaf(JsonNode n,String key,String p,int scale,boolean signed,boolean positive) {
        leaf(n,key,p,v->normalize(n,key,v,p+"/"+key,scale,signed,positive));
    }
    private void normalize(JsonNode parent,String key,JsonNode n,String p,int scale,boolean signed,boolean positive) {
        if(!n.isTextual() || n.asText("").length()>23) throw invalid(p,"DECIMAL_RANGE");
        String s=n.asText("");
        if(!s.matches((signed?"-?":"")+"(0|[1-9][0-9]{0,11})(\\.[0-9]{1,"+scale+"})?"))
            throw invalid(p,s.matches("-?(0|[1-9][0-9]{0,11})\\.[0-9]+")?"DECIMAL_SCALE":"DECIMAL_RANGE");
        BigDecimal value=new BigDecimal(s);
        if((s.startsWith("-") && value.signum()==0) || (positive && value.signum()==0)) throw invalid(p,"DECIMAL_RANGE");
        ((ObjectNode)parent).put(key,value.setScale(scale).toPlainString());
    }
    private void text(JsonNode n,String key,String p,int max,boolean mandatory) {
        if(!n.has(key)) {if(mandatory) issues.add(issue(p+"/"+key,"REQUIRED"));return;}
        JsonNode v=n.get(key);if(!v.isTextual()) throw invalid(p+"/"+key,"TEXT_INVALID");
        String raw=v.asText("");
        if(raw.codePoints().anyMatch(Character::isISOControl)) throw invalid(p+"/"+key,"TEXT_INVALID");
        String s=raw.strip();if(s.isEmpty() || s.codePointCount(0,s.length())>max) throw invalid(p+"/"+key,"TEXT_INVALID");
        ((ObjectNode)n).put(key,s);
    }
    private void bool(JsonNode n,String key,String p,boolean mandatory) {
        if(!n.has(key)) {if(mandatory) issues.add(issue(p+"/"+key,"REQUIRED"));return;}
        if(!n.get(key).isBoolean()) throw invalid(p+"/"+key,"BOOLEAN_REQUIRED");
    }
    private void enumLeaf(JsonNode n,String key,String p,String values) {leaf(n,key,p,v->enumeration(v,p+"/"+key,values));}
    private void dateLeaf(JsonNode n,String key,String p) {leaf(n,key,p,v->date(v,p+"/"+key));}
    private void optionalDate(JsonNode n,String key,String p) {if(n.has(key)) date(n.get(key),p+"/"+key);}
    private void leaf(JsonNode n,String key,String p,java.util.function.Consumer<JsonNode> check) {
        if(!n.has(key)) issues.add(issue(p+"/"+key,"REQUIRED"));else check.accept(n.get(key));
    }
    private static JsonNode required(JsonNode n,String key,String p) {
        if(n==null || !n.has(key)) throw invalid(p+"/"+key,"REQUIRED");return n.get(key);
    }
    private static void object(JsonNode n,String p,String fields) {
        if(n==null || !n.isObject()) throw invalid(p,"OBJECT_REQUIRED");
        Set<String> allowed=new HashSet<>(Arrays.asList(fields.split(" ")));
        for(String key:n.propertyNames()) if(!allowed.contains(key)) throw invalid(p,"UNKNOWN_FIELD");
    }
    private static void array(JsonNode n,String p,int limit) {
        if(!n.isArray()) throw invalid(p,"ARRAY_REQUIRED");if(n.size()>limit) throw invalid(p,"ITEM_LIMIT");
    }
    private static String enumeration(JsonNode n,String p,String values) {
        if(!n.isTextual() || !Arrays.asList(values.split(" ")).contains(n.asText(""))) throw invalid(p,"ENUM_INVALID");return n.asText("");
    }
    private static void integer(JsonNode n,String p,int min,int max) {
        if(!n.isIntegralNumber() || !n.canConvertToInt() || n.intValue()<min || n.intValue()>max) throw invalid(p,"INTEGER_RANGE");
    }
    private static long revision(JsonNode n,String p) {
        if(!n.isTextual() || !n.asText("").matches("0|[1-9][0-9]{0,18}")) throw invalid(p,"REVISION_INVALID");
        try {return Long.parseLong(n.asText(""));}catch(NumberFormatException e){throw invalid(p,"REVISION_INVALID");}
    }
    private static UUID uuid(JsonNode n,String p) {
        if(!n.isTextual() || !n.asText("").matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) throw invalid(p,"UUID_INVALID");
        return UUID.fromString(n.asText(""));
    }
    private static void date(JsonNode n,String p) {
        if(!n.isTextual() || !n.asText("").matches("[0-9]{4}-[0-9]{2}-[0-9]{2}") || n.asText("").startsWith("0000")) throw invalid(p,"DATE_INVALID");
        try {LocalDate.parse(n.asText(""));}catch(java.time.DateTimeException e){throw invalid(p,"DATE_INVALID");}
    }
    private static void depth(JsonNode n,int depth) {
        if(depth>12) throw new DraftProblem(413,"BODY_LIMIT");
        if(n==null) throw invalid("","JSON_INVALID");
        if(n.isObject() || n.isArray()) for(JsonNode child:n) depth(child,depth+1);
    }
}
