package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.onboarding.*;
import com.controlefinanceiro.api.domain.investment.Investment;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.*;
import java.time.*;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static com.controlefinanceiro.api.domain.onboarding.SummaryAmount.*;

/** Pure projection of the saved interview over one coherent authoritative inventory.
 * It validates before any financial write and is run again at commit. */
public final class OnboardingProjection {
    public static final BigDecimal ZERO=new BigDecimal("0.00");
    public static final List<String> SECTIONS=List.of("accounts","investments","cards","goals","allocations","forecasts");
    public static final Map<String,String> KINDS=Map.of("accounts","ACCOUNT","investments","INVESTMENT","cards","CARD","goals","GOAL","allocations","ALLOCATION","forecasts","FORECAST");
    public static final class Source {
        public String key,kind; public JsonNode ref,row; public BigDecimal value;
        public boolean archived; public BigDecimal total; public final Map<String,BigDecimal> pairs=new TreeMap<>();
        public final Set<String> blocking=new TreeSet<>(); public SummaryAmount reserved,free,capacity;
        public SummaryAmount declaredReserved=empty();
    }
    public static final class GoalView {
        public String key,type; public JsonNode ref,row; public BigDecimal numeric;
        public SummaryAmount progress,covered;
    }
    public record Allocation(JsonNode command,String goal,String source,BigDecimal previous,BigDecimal amount,UUID id,String action) {}
    public record Declaration(JsonNode command,JsonNode previous,JsonNode result,JsonNode evidence) {}
    public final Map<String,Source> sources=new TreeMap<>();
    public final Map<String,GoalView> goals=new TreeMap<>();
    public final Map<String,JsonNode> cards=new TreeMap<>();
    public final List<Allocation> allocations=new ArrayList<>();
    public final List<Declaration> declarations=new ArrayList<>();
    public final Map<String,JsonNode> reservations=new TreeMap<>();
    public final Map<String,String> aliases=new HashMap<>();
    public final List<JsonNode> mappingPreview=new ArrayList<>();
    public final List<JsonNode> evidence=new ArrayList<>();
    public final JsonNode payload; public final OnboardingInventory.Snapshot inventory;
    public final Instant asOf; public final LocalDate baseDate; public final String baseToken;
    private final Map<String,JsonNode> allocationRows=new HashMap<>();
    private final Map<String,JsonNode> selected=new HashMap<>();
    private final List<JsonNode> byCard=new ArrayList<>();
    private final Map<String,SummaryAmount> declaredProgress=new HashMap<>();
    private final long maxRelations;private long relations;
    private SummaryAmount reservedAccounts=empty(),reservedInvestments=empty();
    private final Map<String,String> invoiceCards=new HashMap<>();
    private final Map<String,String> invoiceStatuses=new HashMap<>();
    private final Map<String,List<JsonNode>> cardLines=new HashMap<>();

    public OnboardingProjection(JsonNode payload,OnboardingInventory.Snapshot inventory,Instant asOf) {
        this(payload,inventory,asOf,200000);
    }
    public OnboardingProjection(JsonNode payload,OnboardingInventory.Snapshot inventory,Instant asOf,long maxRelations) {
        this.maxRelations=maxRelations;
        this.payload=payload;this.inventory=inventory;this.asOf=asOf;
        this.baseDate=LocalDate.parse(payload.at("/context/baseDate").asText());
        this.baseToken=baseToken(inventory,payload);
        existing();selection();legacy();confirmations();reservationParts();newAllocations();summarizeSources();summarizeGoals();summarizeCards();
    }
    public JsonNode items(String section) {return payload.path("sections").path(section).path("items");}
    public static String baseToken(OnboardingInventory.Snapshot inventory,JsonNode payload) {
        ObjectNode base=inventory.rows().deepCopy();base.remove("reservations");
        List<JsonNode> proposed=new ArrayList<>();for(String section:List.of("accounts","investments"))for(JsonNode item:payload.at("/sections/"+section+"/items"))if(item.path("action").asText().equals("CREATE"))proposed.add(item);
        return hash(node("inventory",base,"proposedSources",proposed));
    }
    public String key(JsonNode ref) {
        if(ref.has("tempId")) return aliases.getOrDefault(ref.path("tempId").asText(),ref.path("kind").asText()+":"+ref.path("tempId").asText());
        return ref.path("kind").asText()+":"+ref.path("id").asText();
    }
    private void existing() {
        for(JsonNode invoice:inventory.table("invoices")){invoiceCards.put(invoice.path("id").asText(),invoice.path("card_id").asText());invoiceStatuses.put(invoice.path("id").asText(),invoice.path("status").asText());}
        for(JsonNode line:inventory.table("lines"))cardLines.computeIfAbsent(cardForInvoice(line.path("invoice_id").asText()),k->new ArrayList<>()).add(line);
        for(String table:List.of("accounts","investments")) for(JsonNode row:inventory.table(table)) {
            Source s=new Source();s.kind=table.equals("accounts")?"ACCOUNT":"INVESTMENT";s.key=s.kind+":"+row.path("id").asText();
            s.ref=node("kind",s.kind,"id",row.path("id").asText());s.row=row;
            s.value=decimal(row.get(table.equals("accounts")?"balance":"valuation_amount"));s.archived=row.path("is_archived").asBoolean(false);sources.put(s.key,s);
            individual(s.value,s.kind.equals("ACCOUNT"),"/existing/sources/"+s.key+"/value");
        }
        for(JsonNode row:inventory.table("goals")) {
            GoalView g=new GoalView();g.key="GOAL:"+row.path("id").asText();g.type=row.path("type").asText();g.row=row;
            g.ref=node("kind","GOAL","id",row.path("id").asText());
            if(row.path("numeric_progress_known").asBoolean()) g.numeric=decimal(row.get("current_value"));goals.put(g.key,g);
        }
        for(JsonNode row:inventory.table("cards")) cards.put("CARD:"+row.path("id").asText(),row);
        for(JsonNode row:inventory.table("allocations")) {
            String source=row.path("account_id").isNull()?"INVESTMENT:"+row.path("investment_id").asText():"ACCOUNT:"+row.path("account_id").asText();
            Source s=sources.get(source);String goal="GOAL:"+row.path("goal_id").asText();
            if(s==null || !goals.containsKey(goal)) throw new DraftProblem(400,"BUSINESS_RULE",List.of(DraftProblem.issue("/existing/allocations","ALLOCATION_UNRECONCILED")));
            allocationRows.put(goal+"|"+source,row);
            individual(decimal(row.get("amount")),false,"/existing/allocations/"+row.path("id").asText()+"/amount");
            // Declarations have a single authoritative reservation identity; don't count the materialized pair twice.
            if(row.path("reservation_id").isNull() || row.path("reservation_id").isMissingNode()) s.pairs.put(goal,decimal(row.get("amount")));
        }
    }
    private void selection() {
        for(String section:List.of("accounts","investments","cards","goals")) for(JsonNode item:items(section)) {
            String kind=KINDS.get(section),temp=item.path("tempId").asText(),action=item.path("action").asText();
            String k=kind+":"+temp;JsonNode ref=node("kind",kind,"tempId",temp);
            if(item.has("ref")) {k=key(item.get("ref"));aliases.put(temp,k);}
            selected.put(k,item);mappingPreview.add(node("tempId",temp,"kind",kind,"action",action,"existingId",item.has("ref")?item.at("/ref/id").asText():null));
            if(kind.equals("ACCOUNT") || kind.equals("INVESTMENT")) {
                Source s=sources.get(k);
                if(action.equals("CREATE")) {s=new Source();s.key=k;s.kind=kind;s.row=item;s.value=kind.equals("ACCOUNT")?fact(item.path("balance")):investmentValue(item);sources.put(k,s);}
                if(s==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");s.ref=ref;
                if(action.equals("INITIALIZE_DEFAULT")) {
                    final String accountId=item.at("/ref/id").asText();boolean identity=false;
                    for(JsonNode d:inventory.table("defaults")) if(d.path("account_id").asText().equals(accountId)) identity=true;
                    boolean allocated=allocationRows.keySet().stream().anyMatch(x->x.endsWith("|ACCOUNT:"+accountId));
                    if(!identity || s.archived || s.value==null || s.value.signum()!=0 || decimal(s.row.get("opening_balance"))==null
                            || decimal(s.row.get("opening_balance")).signum()!=0 || !s.row.path("opening_origin").asText().equals("SYSTEM_INITIALIZED")
                            || s.row.path("used").asBoolean() || allocated) throw new DraftProblem(409,"DEFAULT_NOT_PRISTINE");
                    s.value=fact(item.path("balance"));
                }
            } else if(kind.equals("GOAL")) {
                GoalView g=goals.get(k);
                if(action.equals("CREATE")) {g=new GoalView();g.key=k;g.type=item.path("type").asText();g.row=item;g.numeric=decimal(item.get("initialProgress"));goals.put(k,g);}
                if(g==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");g.ref=ref;
            } else {
                if(action.equals("CREATE")) cards.put(k,item);
                else if(!cards.containsKey(k)) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
                if(action.equals("INITIALIZE_EMPTY")) {
                    JsonNode card=cards.get(k);String id=item.at("/ref/id").asText();
                    if(card.path("opened").asBoolean() || card.path("used").asBoolean() || decimal(card.get("credit_balance")).signum()!=0) throw new DraftProblem(409,"SOURCE_CHANGED");
                    if(!cardLines.getOrDefault(id,List.of()).isEmpty())throw new DraftProblem(409,"SOURCE_CHANGED");
                }
                if(item.has("opening")) for(JsonNode part:item.path("opening").path("futureInstallments")) mappingPreview.add(node("tempId",part.path("tempId").asText(),"kind","INSTALLMENT","action","CREATE","existingId",null));
            }
        }
        for(String section:List.of("allocations","forecasts")) for(JsonNode item:items(section)) mappingPreview.add(node("tempId",item.path("tempId").asText(),"kind",KINDS.get(section),"action","CREATE","existingId",null));
        for(JsonNode forecast:items("forecasts")) if(!sources.containsKey(key(forecast.path("account"))) || sources.get(key(forecast.path("account"))).archived) business("/sections/forecasts","SOURCE_INELIGIBLE");
    }
    private static BigDecimal investmentValue(JsonNode item) {
        JsonNode v=item.path("valuation");if(!v.path("state").asText().equals("KNOWN")) return null;
        if(v.path("basis").asText().equals("TOTAL")) return decimal(v.get("amount"));
        Investment i=new Investment();i.setQuantity(fact(item.path("quantity")));i.evaluate(decimal(v.get("price")),LocalDate.parse(v.path("date").asText()),"USER_DECLARED");return i.getTotalValue();
    }
    private void legacy() {
        for(JsonNode row:inventory.table("reservations")) {
            JsonNode r=JSON.readTree(row.path("attribution").asText());
            ReservationEvidencePolicy.validate(r);
            if(!r.path("reservationId").asText().equals(row.path("id").asText()) || !r.path("revision").asText().equals(row.path("revision").asText())) throw new DraftProblem(409,"SOURCE_CHANGED");
            reservations.put(r.path("reservationId").asText(),r.deepCopy());
            JsonNode ev=JSON.readTree(row.path("evidence").asText());ev.forEach(evidence::add);
        }
        // V5 explicitly classified these values as unreconciled; neither current_value
        // nor the lack of a source is evidence of a known amount or independence.
        for(GoalView g:goals.values()) if(g.type.equals("MONETARY") && g.row.has("allocation_reconciled") && !g.row.path("allocation_reconciled").asBoolean()) {
            String id=g.row.path("id").asText();reservations.putIfAbsent(id,node("reservationId",id,"revision","0","goal",node("state","KNOWN","value",g.ref),
                    "nominal",unknown("/existing/goals/"+id+"/progress").json(),"attribution",node("state","UNBOUNDED","excluded",List.of())));
        }
        for(Source s:sources.values()) if(s.kind.equals("INVESTMENT") && s.row.hasNonNull("goal_id")) {
            String id=s.row.path("id").asText();String pair="GOAL:"+s.row.path("goal_id").asText()+"|"+s.key;
            if(!allocationRows.containsKey(pair)) reservations.putIfAbsent(id,node("reservationId",id,"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",s.row.path("goal_id").asText())),
                    "nominal",unknown("/existing/investments/"+id+"/reservation").json(),"attribution",node("state","UNBOUNDED","excluded",List.of())));
        }
    }
    private void confirmations() {
        Set<String> declaredPairs=new HashSet<>();
        for(JsonNode command:payload.path("reservationConfirmations")) {
            String id=command.path("reservationId").asText();JsonNode previous=reservations.get(id);
            if(previous==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
            if(!command.path("expectedRevision").asText().equals(previous.path("revision").asText())) throw new DraftProblem(409,"SOURCE_CHANGED");
            long revision=Long.parseLong(previous.path("revision").asText());if(revision==Long.MAX_VALUE) throw new DraftProblem(409,"SOURCE_CHANGED");
            String action=command.path("action").asText();List<JsonNode> parts=new ArrayList<>(),refs=new ArrayList<>();BigDecimal nominal=ZERO;
            if(action.equals("ASSIGN")) {
                String goal=key(command.path("goal"));GoalView g=goals.get(goal);if(g==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
                if(!g.type.equals("MONETARY")) business("/reservationConfirmations","GOAL_TYPE_MISMATCH");
                for(JsonNode part:command.path("parts")) {
                    String source=key(part.path("source")),pair=goal+"|"+source;
                    if(!sources.containsKey(source)) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
                    JsonNode old=allocationRows.get(pair);
                    if(!declaredPairs.add(pair) || (old!=null && !old.path("reservation_id").asText().equals(id))) business("/reservationConfirmations","RESERVATION_CONFIRMATION_INVALID");
                    for(JsonNode a:items("allocations")) if((key(a.path("goal"))+"|"+key(a.path("source"))).equals(pair)) business("/reservationConfirmations","RESERVATION_CONFIRMATION_INVALID");
                    BigDecimal amount=decimal(part.get("amount"));nominal=nominal.add(amount);refs.add(sources.get(source).ref);
                    parts.add(node("source",sources.get(source).ref,"amount",known(amount).json()));
                }
            }
            String evidenceId=UUID.nameUUIDFromBytes((id+":"+(revision+1)+":"+baseToken).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
            JsonNode ev=node("id",evidenceId,"revision",Long.toString(revision+1),"basis","CURRENT_DECLARATION","reservationId",id,
                    "claim",action.equals("ASSIGN")?"ASSIGNMENT":"CLOSURE","sources",refs,"inventoryToken",baseToken,"validatedAt",asOf.toString());
            JsonNode result=node("reservationId",id,"revision",Long.toString(revision+1),"goal",action.equals("ASSIGN")?node("state","KNOWN","value",goals.get(key(command.path("goal"))).ref):previous.path("goal"),
                    "nominal",known(nominal).json(),"attribution",action.equals("ASSIGN")?node("state","CONFIRMED","parts",parts,"evidenceRefs",List.of(evidenceId)):node("state","CLOSED","evidenceRefs",List.of(evidenceId)));
            reservations.put(id,result);evidence.add(ev);declarations.add(new Declaration(command,previous,result,ev));
        }
    }
    private boolean proven(JsonNode r,JsonNode refs,String claim,List<JsonNode> expectedSources) {
        if(!refs.isArray() || refs.isEmpty()) return false;
        for(JsonNode id:refs) {
            boolean match=false;
            for(JsonNode e:evidence) if(e.path("id").asText().equals(id.asText()) && e.path("reservationId").asText().equals(r.path("reservationId").asText())
                    && e.path("claim").asText().equals(claim) && (e.path("inventoryToken").asText().equals(baseToken) || domainLink(r,e,claim))
                    && Set.of("DOMAIN_RECORD","CURRENT_DECLARATION").contains(e.path("basis").asText())
                    && canonical(e.path("sources")).equals(canonical(JSON.valueToTree(expectedSources)))) match=true;
            if(!match) return false;
        }
        return true;
    }
    private boolean domainLink(JsonNode r,JsonNode e,String claim) {
        if(!e.path("basis").asText().equals("DOMAIN_RECORD") || !claim.equals("ASSIGNMENT") || e.path("sources").size()!=1 || r.at("/attribution/parts").size()!=1)return false;
        JsonNode ref=e.path("sources").get(0);Source s=sources.get(key(ref));
        return s!=null && s.kind.equals("INVESTMENT") && s.row.hasNonNull("goal_id") && r.at("/goal/value/id").asText().equals(s.row.path("goal_id").asText())
                && r.at("/attribution/parts/0/amount/state").asText().equals("UNKNOWN");
    }
    private void reservationParts() {
        for(JsonNode r:reservations.values()) {
            JsonNode a=r.path("attribution");String state=a.path("state").asText(),id=r.path("reservationId").asText();
            List<JsonNode> refs=new ArrayList<>();List<String> affected=new ArrayList<>();
            if(state.equals("CONFIRMED")) a.path("parts").forEach(p->refs.add(p.path("source")));
            if(state.equals("CANDIDATES")) a.path("sources").forEach(refs::add);
            boolean valid=state.equals("CONFIRMED")?proven(r,a.path("evidenceRefs"),"ASSIGNMENT",refs):
                    state.equals("CANDIDATES")?proven(r,a.path("evidenceRefs"),"EXHAUSTIVE_CANDIDATES",refs):state.equals("CLOSED")&&proven(r,a.path("evidenceRefs"),"CLOSURE",List.of());
            if(state.equals("CLOSED") && valid) continue;
            if(state.equals("CONFIRMED") && valid) {
                for(JsonNode ref:refs)if(!sources.containsKey(key(ref)))valid=false;
                if(r.at("/goal/state").asText().equals("KNOWN") && (!goals.containsKey(key(r.at("/goal/value"))) || !goals.get(key(r.at("/goal/value"))).type.equals("MONETARY")))valid=false;
            }
            if(state.equals("CONFIRMED") && valid) {
                for(JsonNode part:a.path("parts")) {
                    Source s=sources.get(key(part.path("source")));
                    if(s==null) {valid=false;break;}
                    if(part.at("/amount/state").asText().equals("KNOWN") && r.at("/goal/state").asText().equals("KNOWN")) {
                        String goal=key(r.at("/goal/value"));
                        if(!goals.containsKey(goal) || !goals.get(goal).type.equals("MONETARY")) {valid=false;break;}
                        BigDecimal amount=decimal(part.at("/amount/value"));
                        if(amount.signum()<=0 || amount.compareTo(MONEY_MAX)>0 || s.pairs.containsKey(goal)) business("/existing/reservations","ALLOCATION_UNRECONCILED");
                        s.pairs.put(goal,amount);
                    } else {
                        SummaryAmount missing=readAmount(part.path("amount"),"/existing/reservations/"+id+"/amount");
                        s.declaredReserved=s.declaredReserved.plus(missing);
                        if(!missing.complete())block(s,id);
                        if(r.at("/goal/state").asText().equals("KNOWN"))declaredProgress.merge(key(r.at("/goal/value")),missing,SummaryAmount::plus);
                        if(s.kind.equals("ACCOUNT"))reservedAccounts=reservedAccounts.plus(missing);else reservedInvestments=reservedInvestments.plus(missing);
                    }
                    affected.add(s.key);
                }
            }
            if(state.equals("CANDIDATES") && valid && !refs.isEmpty()) for(JsonNode ref:refs) {
                if(!sources.containsKey(key(ref))) {valid=false;break;}affected.add(key(ref));
            }
            if(!valid || state.equals("UNBOUNDED")) {
                affected.clear();affected.addAll(sources.keySet());
                if(state.equals("UNBOUNDED")) for(JsonNode exclusion:a.path("excluded")) {
                    if(proven(r,exclusion.path("evidenceRefs"),"EXCLUSION",List.of(exclusion.path("source")))) affected.remove(key(exclusion.path("source")));
                }
            }
            if(!state.equals("CONFIRMED") || !valid) for(String source:affected) block(sources.get(source),id);
            // Nominal is counted ONCE by dimension only if every possible origin has that kind.
            Set<String> kinds=new HashSet<>();for(String source:affected) kinds.add(sources.get(source).kind);
            if(state.equals("CONFIRMED") && valid) continue; // exact parts are counted with normal pairs below
            SummaryAmount nominal=readAmount(r.path("nominal"),"/existing/reservations/"+id+"/nominal");
            if(kinds.equals(Set.of("ACCOUNT"))) reservedAccounts=reservedAccounts.plus(nominal);
            else if(kinds.equals(Set.of("INVESTMENT"))) reservedInvestments=reservedInvestments.plus(nominal);
            else {reservedAccounts=reservedAccounts.plus(unknown("/existing/reservations/"+id+"/origin"));reservedInvestments=reservedInvestments.plus(unknown("/existing/reservations/"+id+"/origin"));}
        }
    }
    private void newAllocations() {
        for(Source s:sources.values()) {
            s.total=total(s);
            JsonNode item=selected.get(s.key);
            if(item!=null && item.path("action").asText().equals("INITIALIZE_DEFAULT") && (!s.blocking.isEmpty() || total(s).signum()>0))throw new DraftProblem(409,"DEFAULT_NOT_PRISTINE");
        }
        Map<String,BigDecimal> originalTotals=new HashMap<>();sources.values().forEach(s->originalTotals.put(s.key,total(s)));
        for(JsonNode command:items("allocations")) {
            String source=key(command.path("source")),goal=key(command.path("goal"));Source s=sources.get(source);GoalView g=goals.get(goal);
            if(s==null || g==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
            if(!g.type.equals("MONETARY")) business("/sections/allocations","GOAL_TYPE_MISMATCH");
            JsonNode old=allocationRows.get(goal+"|"+source);BigDecimal previous=s.pairs.getOrDefault(goal,ZERO),amount=decimal(command.get("amount"));
            if(old!=null && !old.path("reservation_id").isNull() && !old.path("reservation_id").isMissingNode()) business("/sections/allocations","ALLOCATION_UNRECONCILED");
            if(amount.signum()==0 && old==null) business("/sections/allocations","ALLOCATION_UNRECONCILED");
            if(amount.compareTo(previous)>0 && !s.blocking.isEmpty()) business("/sections/allocations","SOURCE_RESERVATION_UNRECONCILED");
            if(amount.compareTo(previous)>0 && (s.archived || s.value==null)) business("/sections/allocations","SOURCE_INELIGIBLE");
            s.pairs.put(goal,amount);
            allocations.add(new Allocation(command,goal,source,previous,amount,old==null?null:UUID.fromString(old.path("id").asText()),amount.signum()==0?"RELEASE":old==null?"CREATE":"UPDATE"));
        }
        for(Source s:sources.values()) if(!com.controlefinanceiro.api.domain.goal.ReservationCapacity.allows(s.value,originalTotals.get(s.key),total(s).subtract(originalTotals.get(s.key)),!s.archived)) business("/sections/allocations","RESERVATION_EXCEEDS_SOURCE");
        for(Allocation a:allocations) for(JsonNode preview:mappingPreview) if(preview.path("tempId").equals(a.command.path("tempId"))) {
            ((ObjectNode)preview).put("action",a.action);if(a.id!=null)((ObjectNode)preview).put("existingId",a.id.toString());
        }
    }
    private void summarizeSources() {
        for(Source s:sources.values()) {
            s.total=total(s);
            s.reserved=(s.pairs.isEmpty()?empty():known(pairTotal(s))).plus(s.declaredReserved);
            if(!s.blocking.isEmpty()) {
                s.reserved=s.reserved.hasKnown()?s.reserved.plus(unknown("/existing/sources/"+s.key+"/reservations")):unknown("/existing/sources/"+s.key+"/reservations");
                s.free=unknown("/existing/sources/"+s.key+"/free");
            } else s.free=s.value==null?unknown("/existing/sources/"+s.key+"/value"):known(s.value.subtract(total(s)));
            s.capacity=s.value!=null && s.value.signum()<=0?known(ZERO):s.free.complete()?known(s.free.subtotal().max(ZERO).min(MONEY_MAX)):unknown("/existing/sources/"+s.key+"/capacity");
            SummaryAmount exact=s.pairs.isEmpty()?empty():known(pairTotal(s));if(s.kind.equals("ACCOUNT")) reservedAccounts=reservedAccounts.plus(exact);else reservedInvestments=reservedInvestments.plus(exact);
        }
    }
    private void summarizeGoals() {
        Map<String,SummaryAmount> progressByGoal=new HashMap<>(declaredProgress),coveredByGoal=new HashMap<>();Set<String> uncertain=new HashSet<>();
        for(Source s:sources.values()) {
            uncertain.addAll(s.blocking);
            for(var pair:s.pairs.entrySet()) {
                progressByGoal.merge(pair.getKey(),known(pair.getValue()),SummaryAmount::plus);
                SummaryAmount covered=!s.blocking.isEmpty() || s.value==null || (s.pairs.size()>1 && s.total.compareTo(s.value.max(ZERO))>0)?unknown("/existing/sources/"+s.key+"/coverage"):known(pair.getValue().min(s.value.max(ZERO)));
                coveredByGoal.merge(pair.getKey(),covered,SummaryAmount::plus);
            }
        }
        for(JsonNode r:reservations.values())if(r.at("/goal/state").asText().equals("KNOWN") && uncertain.contains(r.path("reservationId").asText())) {
            String goal=key(r.at("/goal/value"));SummaryAmount gap=unknown("/existing/reservations/"+r.path("reservationId").asText()+"/progress");
            progressByGoal.merge(goal,gap,SummaryAmount::plus);coveredByGoal.merge(goal,gap,SummaryAmount::plus);
        }
        for(GoalView g:goals.values()) {
            if(g.type.equals("NUMERIC")) {g.progress=g.numeric==null?new SummaryAmount(ZERO,false,List.of("/existing/goals/"+g.key+"/progress"),8):new SummaryAmount(g.numeric,true,List.of(),8);continue;}
            g.progress=progressByGoal.getOrDefault(g.key,empty());g.covered=coveredByGoal.getOrDefault(g.key,empty());
        }
    }
    private void summarizeCards() {
        for(var entry:cards.entrySet()) {
            String k=entry.getKey();JsonNode card=entry.getValue(),item=selected.get(k);BigDecimal debt=ZERO,credit,limit;SummaryAmount committed=empty();boolean debtKnown=true;
            JsonNode ref=item==null?node("kind","CARD","id",card.path("id").asText()):node("kind","CARD","tempId",item.path("tempId").asText());
            if(item!=null && item.has("opening")) {
                JsonNode opening=item.path("opening");debt=decimal(opening.get("currentOutstanding"));credit=decimal(opening.get("credit"));
                committed=component(opening.path("currentPrincipal"),"/sections/cards/"+item.path("tempId").asText()+"/opening/currentPrincipal");
                for(JsonNode future:opening.path("futureInstallments")) {debt=debt.add(decimal(future.get("amount")));committed=committed.plus(component(future.path("principal"),"/sections/cards/"+item.path("tempId").asText()+"/opening/"+future.path("tempId").asText()+"/principal"));}
            } else {
                credit=decimal(card.get("credit_balance"));
                for(JsonNode line:cardLines.getOrDefault(card.path("id").asText(),List.of())) {
                    if(line.path("origin").asText().equals("LEGACY_UNKNOWN") && invoiceStatus(line.path("invoice_id").asText()).equals("PAID"))continue;
                    BigDecimal remaining=decimal(line.get("amount")).subtract(decimal(line.get("paid_amount"))).subtract(decimal(line.get("refunded_amount")));
                    if(remaining.signum()<0){debtKnown=false;committed=committed.plus(unknown("/existing/cards/"+k+"/unreconciledAdjustment"));continue;}
                    debt=debt.add(remaining);
                    if(line.path("origin").asText().equals("OPENING")) {
                        BigDecimal principal=decimal(line.get("opening_principal"));
                        committed=committed.plus(principal==null?unknown("/existing/cards/"+k+"/principal"):known(principal.min(remaining.max(ZERO))));
                    } else committed=committed.plus(line.path("origin").asText().equals("PURCHASE")?known(remaining):unknown("/existing/cards/"+k+"/principal"));
                }
            }
            limit=item!=null && item.path("action").asText().equals("CREATE")?fact(item.path("limit")):decimal(card.get("card_limit"));
            individual(debt,false,"/existing/cards/"+k+"/debt");individual(credit,false,"/existing/cards/"+k+"/credit");individual(limit,false,"/existing/cards/"+k+"/limit");
            SummaryAmount available=limit==null || !committed.complete()?unknown("/existing/cards/"+k+"/availableLimit"):known(limit.subtract(committed.subtotal()));
            byCard.add(node("ref",ref,"debt",fact(debtKnown?debt:null,2),"credit",fact(credit,2),"committed",committed.json(),"availableLimit",available.json()));
        }
    }
    private String cardForInvoice(String invoice) {return invoiceCards.getOrDefault(invoice,"");}
    private String invoiceStatus(String invoice) {return invoiceStatuses.getOrDefault(invoice,"");}
    public JsonNode sourceSnapshot() {
        List<JsonNode> list=new ArrayList<>();
        for(Source s:sources.values()) if(s.row.has("id")) list.add(node("kind",s.kind,"id",s.row.path("id").asText(),"revision",s.row.path("version").isNull()?"0":s.row.path("version").asText("0"),"token",hash(node("row",s.row,"inventoryToken",inventory.token()))));
        for(var entry:cards.entrySet()) if(entry.getValue().has("id")) list.add(node("kind","CARD","id",entry.getValue().path("id").asText(),"revision","0","token",hash(node("row",entry.getValue(),"inventoryToken",inventory.token()))));
        for(GoalView g:goals.values()) if(g.row.has("id")) list.add(node("kind","GOAL","id",g.row.path("id").asText(),"revision",g.row.path("version").isNull()?"0":g.row.path("version").asText("0"),"token",hash(node("row",g.row,"inventoryToken",inventory.token()))));
        return canonical(node("inventoryToken",inventory.token(),"sources",list));
    }
    public JsonNode summary() {
        SummaryAmount accounts=empty(),investments=empty(),free=empty(),unallocated=empty(),debt=empty(),credit=empty();
        List<JsonNode> bySource=new ArrayList<>(),byGoal=new ArrayList<>();
        for(Source s:sources.values()) {
            SummaryAmount value=s.value==null?unknown("/existing/sources/"+s.key+"/value"):known(s.value);
            if(s.kind.equals("ACCOUNT")){accounts=accounts.plus(value);free=free.plus(s.free);}else{investments=investments.plus(value);unallocated=unallocated.plus(s.free);}
            bySource.add(node("ref",s.ref,"value",fact(s.value,2),"reserved",s.reserved.json(),"free",s.free.json(),"newAllocationCapacity",s.capacity.json()));
        }
        for(JsonNode c:byCard){debt=debt.plus(component(c.path("debt"),"/existing/cards/debt"));credit=credit.plus(component(c.path("credit"),"/existing/cards/credit"));}
        for(GoalView g:goals.values()) byGoal.add(node("ref",g.ref,"type",g.type,"progress",g.progress.json(),"covered",g.type.equals("NUMERIC")?na():g.covered.json()));
        List<String> deferred=new ArrayList<>();List<JsonNode> coverage=new ArrayList<>();
        for(String section:SECTIONS) if(payload.at("/sections/"+section+"/answer").asText().equals("DEFERRED")) deferred.add(section);
        if(deferred.contains("investments")) investments=investments.plus(unknown("/sections/investments"));
        if(deferred.contains("cards")){debt=debt.plus(unknown("/sections/cards"));credit=credit.plus(unknown("/sections/cards"));}
        for(String dimension:List.of("accounts","investments","cards","allocations")) {
            SummaryAmount measured=switch(dimension){case "accounts"->accounts;case "investments"->investments;case "cards"->debt;default->reservedAccounts.plus(reservedInvestments);};
            List<String> gaps=new ArrayList<>(measured.missing());if(deferred.contains(dimension))gaps.add("/sections/"+dimension);
            if(dimension.equals("cards")) for(JsonNode card:byCard) for(String field:List.of("committed","availableLimit"))if(!card.path(field).path("state").asText().equals("KNOWN"))gaps.add("/existing/cards/"+key(card.path("ref"))+"/"+field);
            if(dimension.equals("allocations")) sources.values().forEach(s->{if(!s.blocking.isEmpty())gaps.add("/existing/sources/"+s.key+"/reservations");});
            coverage.add(node("dimension",dimension,"complete",gaps.isEmpty(),"missingPaths",new TreeSet<>(gaps)));
        }
        ObjectNode result=node("baseDate",baseDate.toString(),"existingAsOf",asOf.toString(),"scope","SELECTED_AND_EXISTING","coverage",coverage,
                "metrics",node("accountsSigned",accounts.json(),"investmentsValue",investments.json(),"cardCredit",credit.json(),"cardDebt",debt.json(),
                        "netWorth",accounts.plus(investments).plus(credit).plus(debt.negate()).json(),"reservedAccounts",reservedAccounts.json(),"reservedInvestments",reservedInvestments.json(),"freeAccountCash",free.json(),"unallocatedInvestments",unallocated.json()),
                "bySource",bySource,"byCard",byCard,"byGoal",byGoal,"deferredSections",deferred);
        List<JsonNode> allocationChanges=new ArrayList<>();
        for(Allocation a:allocations)if(a.id()!=null)allocationChanges.add(node("tempId",a.command().path("tempId").asText(),"goal",goals.get(a.goal()).ref,"source",sources.get(a.source()).ref,"previousAmount",a.previous().setScale(2).toPlainString(),"amount",a.amount().setScale(2).toPlainString(),"delta",a.amount().subtract(a.previous()).setScale(2).toPlainString()));
        if(!allocationChanges.isEmpty())result.set("allocationChanges",JSON.valueToTree(allocationChanges));
        List<JsonNode> reservationChanges=new ArrayList<>();
        for(Declaration d:declarations)reservationChanges.add(node("reservationId",d.command().path("reservationId").asText(),"action",d.command().path("action").asText(),"previous",d.previous(),"proposed",d.result()));
        if(!reservationChanges.isEmpty())result.set("reservationChanges",JSON.valueToTree(reservationChanges));
        if(!reservations.isEmpty() || !declarations.isEmpty()) {
            List<JsonNode> decisions=new ArrayList<>(),results=new ArrayList<>();
            for(Source s:sources.values()) {
                String reason=!s.blocking.isEmpty()?"RESERVATION_UNCERTAIN":s.archived?"SOURCE_INELIGIBLE":!s.capacity.complete()?"CAPACITY_UNAVAILABLE":s.capacity.subtotal().signum()==0?"NO_CAPACITY":null;
                decisions.add(node("source",s.ref,"blockingReservationIds",s.blocking,"state",reason==null?"ALLOWED":"BLOCKED","reason",reason));
            }
            for(Declaration d:declarations)results.add(node("reservationId",d.command.path("reservationId").asText(),"action",d.command.path("action").asText(),"previousRevision",d.previous.path("revision").asText(),"resultingRevision",d.result.path("revision").asText()));
            result.set("reservationReview",node("reservations",reservations.values(),"evidence",evidence,"decisions",decisions,"confirmations",results));
        }
        return canonical(result);
    }
    private static BigDecimal pairTotal(Source s) {return s.pairs.values().stream().reduce(ZERO,BigDecimal::add);}
    private static BigDecimal total(Source s) {return pairTotal(s).add(s.declaredReserved.subtotal());}
    private void block(Source source,String reservation) {
        if(source.blocking.add(reservation) && ++relations>maxRelations)throw new DraftProblem(503,"SUMMARY_CAPACITY_EXCEEDED");
    }
    private static SummaryAmount component(JsonNode f,String path) {BigDecimal amount=fact(f);return amount==null?unknown(path):known(amount);}
    private static SummaryAmount readAmount(JsonNode n,String path) {
        if(n.path("state").asText().equals("KNOWN")) return known(decimal(n.get("value")));
        if(n.path("state").asText().equals("PARTIAL"))return new SummaryAmount(decimal(n.get("knownSubtotal")),true,List.of(path),2);
        return unknown(path);
    }
    private static void business(String path,String code) {throw new DraftProblem(400,"BUSINESS_RULE",List.of(DraftProblem.issue(path,code)));}
    private static void individual(BigDecimal value,boolean signed,String path) {
        if(value!=null && (value.scale()>2 || value.abs().compareTo(MONEY_MAX)>0 || !signed&&value.signum()<0))business(path,"POSITION_UNRECONCILED");
    }
}
