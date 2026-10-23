package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.onboarding.*;
import jakarta.persistence.EntityManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

/** Internal opening adapter, not the daily purchase/deposit APIs: records stocks,
 * uses existing entity valuation/cycle/temporal rules and never fabricates movements. */
@Component
public class OnboardingOpenings {
    private final EntityManager em;private final JdbcTemplate jdbc;
    private final OnboardingInventory inventory;
    public OnboardingOpenings(EntityManager em,JdbcTemplate jdbc,OnboardingInventory inventory) {this.em=em;this.jdbc=jdbc;this.inventory=inventory;}
    @Transactional(propagation=Propagation.MANDATORY)
    public List<JsonNode> apply(UUID owner,UUID session,OnboardingProjection p,Instant now) {
        User user=em.getReference(User.class,owner);
        Map<String,UUID> ids=new HashMap<>();List<JsonNode> mapping=new ArrayList<>();
        for(var s:p.sources.values()) if(s.row.has("id"))ids.put(s.key,UUID.fromString(s.row.path("id").asText()));
        for(var g:p.goals.values()) if(g.row.has("id"))ids.put(g.key,UUID.fromString(g.row.path("id").asText()));
        p.cards.forEach((k,v)->{if(v.has("id"))ids.put(k,UUID.fromString(v.path("id").asText()));});
        for(JsonNode item:p.items("accounts")) {
            UUID id;String action=item.path("action").asText(),temp=item.path("tempId").asText();
            if(action.equals("CREATE")) {
                Account a=new Account();a.setUser(user);a.setName(item.path("name").asText());a.setType(AccountType.valueOf(item.path("type").asText()));a.setColor(item.path("color").asText(null));
                a.open(fact(item.path("balance")),p.baseDate,now,OpeningBalanceOrigin.USER_PROVIDED);em.persist(a);id=a.getId();
            } else {
                id=UUID.fromString(item.at("/ref/id").asText());
                if(action.equals("INITIALIZE_DEFAULT")) jdbc.update("update accounts set balance=?,opening_balance=?,opening_date=?,opening_origin='USER_PROVIDED',opening_recorded_at=?,version=coalesce(version,0)+1 where id=? and user_id=?",
                        fact(item.path("balance")),fact(item.path("balance")),p.baseDate,java.sql.Timestamp.from(now),id,owner);
            }
            ids.put("ACCOUNT:"+temp,id);map(mapping,temp,"ACCOUNT",id,action);
        }
        for(JsonNode item:p.items("investments")) {
            String action=item.path("action").asText(),temp=item.path("tempId").asText();UUID id;
            if(action.equals("CREATE")) {
                Investment i=new Investment();i.setUser(user);i.setName(item.path("name").asText());i.setTicker(item.path("identifier").asText(null));i.setType(InvestType.valueOf(item.path("type").asText()));
                i.setPositionMode(item.path("positionMode").asText());i.setQuantity(fact(item.path("quantity")));i.setTotalCost(fact(item.path("cost")));
                i.setInstitution(item.path("institution").asText(null));i.setAcquisitionDate(item.at("/acquisitionDate/state").asText().equals("KNOWN")?LocalDate.parse(item.at("/acquisitionDate/value").asText()):null);
                i.setHistoricalSource(item.at("/historicalSource/value").asText(null));i.setOpeningRecordedAt(now);i.setReportingKnownFrom(p.baseDate);
                JsonNode v=item.path("valuation");
                if(v.path("state").asText().equals("KNOWN")) {
                    LocalDate date=LocalDate.parse(v.path("date").asText());
                    if(v.path("basis").asText().equals("TOTAL"))i.evaluateTotal(decimal(v.get("amount")),date,"USER_DECLARED");
                    else i.evaluate(decimal(v.get("price")),date,"USER_DECLARED");
                }
                em.persist(i);id=i.getId();
            } else id=UUID.fromString(item.at("/ref/id").asText());
            ids.put("INVESTMENT:"+temp,id);map(mapping,temp,"INVESTMENT",id,action);
        }
        for(JsonNode item:p.items("goals")) {
            String action=item.path("action").asText(),temp=item.path("tempId").asText();UUID id;
            if(action.equals("CREATE")) {
                Goal g=new Goal();g.setUser(user);g.setTitle(item.path("title").asText());g.setType(GoalType.valueOf(item.path("type").asText()));g.setUnit(item.path("unit").asText(null));
                g.setDeadline(LocalDate.parse(item.path("deadline").asText()));g.setTargetValue(decimal(item.get("target")));
                g.setCurrentValue(g.getType()==GoalType.NUMERIC?decimal(item.get("initialProgress")):BigDecimal.ZERO);g.setNumericProgressKnown(g.getType()==GoalType.NUMERIC);em.persist(g);id=g.getId();
            } else id=UUID.fromString(item.at("/ref/id").asText());
            ids.put("GOAL:"+temp,id);map(mapping,temp,"GOAL",id,action);
        }
        em.flush();
        cards(user,p,ids,mapping,now);
        em.flush();
        declarations(owner,p,ids,now);
        for(var a:p.allocations) {
            UUID id=a.id()==null?UUID.randomUUID():a.id();writePair(id,resolve(ids,p,a.goal()),resolve(ids,p,a.source()),a.source().startsWith("ACCOUNT:"),a.amount(),null);
            map(mapping,a.command().path("tempId").asText(),"ALLOCATION",id,a.action());
        }
        // Aggregation is wide; updating a projection is not a deposit or historical movement.
        Set<String> changedGoals=new HashSet<>();p.allocations.forEach(a->changedGoals.add(a.goal()));
        for(JsonNode item:p.items("goals"))if(item.path("action").asText().equals("CREATE"))changedGoals.add("GOAL:"+item.path("tempId").asText());
        for(var d:p.declarations) {
            if(d.previous().at("/goal/state").asText().equals("KNOWN"))changedGoals.add(p.key(d.previous().at("/goal/value")));
            if(d.result().at("/goal/state").asText().equals("KNOWN"))changedGoals.add(p.key(d.result().at("/goal/value")));
        }
        for(var g:p.goals.values()) if(changedGoals.contains(g.key) && g.type.equals("MONETARY") && g.progress.complete()) {
            UUID id=resolve(ids,p,g.key);jdbc.update("update goals set current_value=?,allocation_reconciled=true,version=coalesce(version,0)+1 where id=? and user_id=?",g.progress.subtotal(),id,owner);
        }
        for(JsonNode item:p.items("forecasts")) {
            Transaction t=new Transaction();t.setUser(user);t.setAccount(em.getReference(Account.class,resolve(ids,p,p.key(item.path("account")))));
            t.setCategory(em.getReference(Category.class,UUID.fromString(item.at("/category/id").asText())));
            t.setDescription(item.path("description").asText());t.setType(TransactionType.valueOf(item.path("direction").asText()));t.setAmount(decimal(item.get("amount")));
            t.setDate(LocalDate.parse(item.path("dueDate").asText()));t.setDueDate(t.getDate());t.setPaid(false);t.setOrigin(TransactionOrigin.USER);
            LocalDateTime local=LocalDateTime.ofInstant(now,ZoneId.of("America/Sao_Paulo"));t.setCreatedAt(local);t.captureTemporal(null,now,local);em.persist(t);
            map(mapping,item.path("tempId").asText(),"FORECAST",t.getId(),"CREATE");
        }
        em.flush();
        for(JsonNode item:mapping)jdbc.update("insert into onboarding_application_items(session_id,temp_id,kind,resource_id,action) values(?,?,?,?,?)",session,UUID.fromString(item.path("tempId").asText()),item.path("kind").asText(),UUID.fromString(item.path("id").asText()),item.path("action").asText());
        bindNewDeclarationsToCommittedInventory(owner,p,ids,now);
        return mapping;
    }
    /** Only this transaction's newly validated declarations certify its resulting
     * inventory. Never refresh old evidence: later changes must still invalidate it.
     * The enclosing complete holds the exclusive owner guard through commit. */
    private void bindNewDeclarationsToCommittedInventory(UUID owner,OnboardingProjection p,Map<String,UUID> ids,Instant now) {
        if(p.declarations.isEmpty())return;
        String token=OnboardingProjection.baseToken(inventory.load(owner),object());
        List<Object[]> updates=new ArrayList<>();
        for(var declaration:p.declarations) {
            var evidence=(tools.jackson.databind.node.ObjectNode)resolveReferences(declaration.evidence(),p,ids);
            evidence.put("inventoryToken",token);
            evidence.put("validatedAt",now.toString());
            updates.add(new Object[]{JSON.valueToTree(List.of(evidence)).toString(),owner,
                    UUID.fromString(declaration.command().path("reservationId").asText()),
                    Long.parseLong(declaration.result().path("revision").asText())});
        }
        for(int changed:jdbc.batchUpdate("update onboarding_reservation_records set evidence=? where user_id=? and id=? and revision=?",updates))
            if(changed==0)throw new IllegalStateException("New reservation declaration changed before final evidence binding");
    }
    private void cards(User user,OnboardingProjection p,Map<String,UUID> ids,List<JsonNode> mapping,Instant now) {
        Map<String,Map<YearMonth,JsonNode>> invoiceRows=new HashMap<>();
        for(JsonNode row:p.inventory.table("invoices"))invoiceRows.computeIfAbsent(row.path("card_id").asText(),k->new HashMap<>()).put(YearMonth.of(row.path("year").intValue(),row.path("month").intValue()),row);
        Category category=null;
        if(!p.items("cards").isEmpty()) {
            var found=jdbc.queryForList("select id from categories where user_id=? and name=? order by id",UUID.class,user.getId(),DefaultCategory.PAGAMENTO_FATURA.getName());
            if(found.isEmpty()) {category=new Category();category.setUser(user);category.setName(DefaultCategory.PAGAMENTO_FATURA.getName());category.setType(TransactionType.EXPENSE);category.setSystemReserved(true);em.persist(category);}
            else category=em.getReference(Category.class,found.getFirst());
        }
        for(JsonNode item:p.items("cards")) {
            String action=item.path("action").asText(),temp=item.path("tempId").asText();CreditCard card;
            if(action.equals("CREATE")) {
                card=new CreditCard();card.setUser(user);card.setName(item.path("name").asText());card.setLast4Digits(item.path("last4Digits").asText(null));card.setBrand(item.path("brand").asText(null));
                card.setLimit(fact(item.path("limit")));card.setClosingDay(item.path("closingDay").intValue());card.setDueDay(item.path("dueDay").intValue());card.setReportingKnownFrom(p.baseDate);em.persist(card);
            } else {
                // INITIALIZE_EMPTY needs configuration, already captured under guard; no SELECT per card.
                card=em.getReference(CreditCard.class,UUID.fromString(item.at("/ref/id").asText()));
            }
            UUID id=card.getId();ids.put("CARD:"+temp,id);map(mapping,temp,"CARD",id,action);
            if(!item.has("opening"))continue;
            JsonNode opening=item.path("opening"),configuration=action.equals("CREATE")?item:p.cards.get(p.key(item.path("ref")));
            int close=configuration.path(action.equals("CREATE")?"closingDay":"closing_day").intValue(),due=configuration.path(action.equals("CREATE")?"dueDay":"due_day").intValue();
            CardOpeningBatch batch=new CardOpeningBatch();batch.setCard(card);batch.setBaseDate(p.baseDate);batch.setCreatedAt(now);em.persist(batch);
            // Avoid initializing an existing card proxy or dirty overwrite of its configuration.
            em.flush();jdbc.update("update credit_cards set credit_balance=?,reporting_known_from=coalesce(reporting_known_from,?) where id=?",decimal(opening.get("credit")),p.baseDate,id);
            Map<YearMonth,Invoice> invoices=new HashMap<>();
            Map<YearMonth,JsonNode> existingInvoices=invoiceRows.getOrDefault(id.toString(),Map.of());Map<YearMonth,LocalDate> overrides=new HashMap<>();
            existingInvoices.forEach((month,row)->{if(row.hasNonNull("due_date_override"))overrides.put(month,LocalDate.parse(row.path("due_date_override").asText()));});
            BigDecimal current=decimal(opening.get("currentOutstanding"));
            line(card,batch,category,opening.path("currentCompetence"),current,fact(opening.path("currentPrincipal")),fact(opening.path("currentCharges")),opening.path("dueDateOverride").asText(null),"Dívida inicial da fatura",close,due,p.baseDate,now,invoices,existingInvoices,overrides);
            for(JsonNode future:opening.path("futureInstallments")) {
                CardTransaction t=line(card,batch,category,future.path("competence"),decimal(future.get("amount")),fact(future.path("principal")),fact(future.path("charges")),future.path("dueDateOverride").asText(null),future.path("description").asText("Parcela futura declarada"),close,due,p.baseDate,now,invoices,existingInvoices,overrides);
                map(mapping,future.path("tempId").asText(),"INSTALLMENT",t.getId(),"CREATE");
            }
        }
    }
    private CardTransaction line(CreditCard card,CardOpeningBatch batch,Category category,JsonNode competence,BigDecimal amount,BigDecimal principal,BigDecimal charges,String override,String description,int close,int due,LocalDate base,Instant now,Map<YearMonth,Invoice> invoices,Map<YearMonth,JsonNode> existingInvoices,Map<YearMonth,LocalDate> overrides) {
        YearMonth month=YearMonth.of(competence.path("year").intValue(),competence.path("month").intValue());
        Invoice invoice=invoices.get(month);
        if(invoice==null) {
            CardCycle cycle=OnboardingFinalRules.openingCycle(month,close,due,"/sections/cards/items");JsonNode previous=existingInvoices.get(month);
            if(previous==null) {
                invoice=new Invoice();invoice.setCard(card);invoice.setYear(month.getYear());invoice.setMonth(month.getMonthValue());invoice.setClosingDate(cycle.closingDate());invoice.setDueDate(cycle.dueDate());
                invoice.setStatus(cycle.closingDate().isAfter(base)?InvoiceStatus.OPEN:InvoiceStatus.CLOSED);em.persist(invoice);
            } else {
                invoice=em.getReference(Invoice.class,UUID.fromString(previous.path("id").asText()));
                LocalDate closing=previous.hasNonNull("closing_date")?LocalDate.parse(previous.path("closing_date").asText()):cycle.closingDate();
                jdbc.update("update invoices set closing_date=coalesce(closing_date,?),due_date=coalesce(due_date,?),status=? where id=?",cycle.closingDate(),cycle.dueDate(),closing.isAfter(base)?"OPEN":"CLOSED",invoice.getId());
            }
            invoices.put(month,invoice);
        }
        if(override!=null) {
            LocalDate date=LocalDate.parse(override);
            if(overrides.containsKey(month) && !overrides.get(month).equals(date)) throw new DraftProblem(400,"BUSINESS_RULE",List.of(DraftProblem.issue("/sections/cards","INVOICE_COMPONENT_MISMATCH")));
            overrides.put(month,date);
            if(existingInvoices.containsKey(month))jdbc.update("update invoices set due_date_override=? where id=?",date,invoice.getId());else invoice.setDueDateOverride(date);
        }
        if(amount.signum()==0)return null; // preserve empty current invoice/override without a fabricated debt line
        CardTransaction t=new CardTransaction();t.setInvoice(invoice);t.setCategory(category);t.setDescription(description);t.setAmount(amount);t.setOpeningPrincipal(principal);t.setOpeningCharges(charges);t.setDate(base);
        LocalDateTime local=LocalDateTime.ofInstant(now,ZoneId.of("America/Sao_Paulo"));t.setCreatedAt(local);t.captureTemporal(null,now,local);t.setOrigin(CardTransactionOrigin.OPENING);t.setOpeningBatchId(batch.getId());em.persist(t);return t;
    }
    private void declarations(UUID owner,OnboardingProjection p,Map<String,UUID> ids,Instant now) {
        for(var d:p.declarations) {
            UUID reservation=UUID.fromString(d.command().path("reservationId").asText());JsonNode resolved=resolveReferences(d.result(),p,ids),ev=resolveReferences(d.evidence(),p,ids);
            List<JsonNode> priorEvidence=p.evidence.stream().filter(e->e.path("reservationId").asText().equals(reservation.toString())&&!e.path("id").equals(d.evidence().path("id"))).toList();
            jdbc.update("insert into onboarding_reservation_history(id,reservation_id,user_id,revision,previous_json,declaration_json,recorded_at) values(?,?,?,?,?,?,?)",UUID.randomUUID(),reservation,owner,Long.parseLong(d.result().path("revision").asText()),node("reservation",d.previous(),"evidence",priorEvidence).toString(),d.command().toString(),java.sql.Timestamp.from(now));
            jdbc.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,?,?,?,?) on conflict(id) do update set revision=excluded.revision,attribution=excluded.attribution,evidence=excluded.evidence,recorded_at=excluded.recorded_at",
                    reservation,owner,Long.parseLong(d.result().path("revision").asText()),resolved.toString(),JSON.valueToTree(List.of(ev)).toString(),java.sql.Timestamp.from(now));
            jdbc.update("delete from goal_allocations where reservation_id=?",reservation);
            // A reconciled V5 direct link is replaced by explicit allocation identity.
            // Preserve its previous state/evidence above; do not leave a second implicit reservation.
            boolean legacyLink=priorEvidence.stream().anyMatch(e->e.path("basis").asText().equals("DOMAIN_RECORD")&&e.path("claim").asText().equals("ASSIGNMENT"));
            if(legacyLink && d.previous().at("/goal/value").has("id"))jdbc.update("update investments set goal_id=null,version=coalesce(version,0)+1 where id=? and user_id=? and goal_id=?",reservation,owner,UUID.fromString(d.previous().at("/goal/value/id").asText()));
            if(d.command().path("action").asText().equals("ASSIGN")) for(JsonNode part:d.command().path("parts")) writePair(UUID.randomUUID(),resolve(ids,p,p.key(d.command().path("goal"))),resolve(ids,p,p.key(part.path("source"))),part.at("/source/kind").asText().equals("ACCOUNT"),decimal(part.get("amount")),reservation);
        }
    }
    private void writePair(UUID id,UUID goal,UUID source,boolean account,BigDecimal amount,UUID reservation) {
        jdbc.update("insert into goal_allocations(id,goal_id,account_id,investment_id,amount,version,reservation_id) values(?,?,?,?,?,0,?) on conflict(id) do update set amount=excluded.amount,version=coalesce(goal_allocations.version,0)+1",id,goal,account?source:null,account?null:source,amount,reservation);
    }
    private static UUID resolve(Map<String,UUID> ids,OnboardingProjection p,String key) {
        UUID id=ids.get(key);if(id==null)throw new IllegalStateException("Unresolved application identity");return id;
    }
    private static JsonNode resolveReferences(JsonNode n,OnboardingProjection p,Map<String,UUID> ids) {
        if(n.isObject() && n.has("kind") && n.has("tempId"))return node("kind",n.path("kind").asText(),"id",resolve(ids,p,p.key(n)).toString());
        if(n.isObject()){var out=object();n.propertyNames().forEach(k->out.set(k,resolveReferences(n.get(k),p,ids)));return out;}
        if(n.isArray()){var out=JSON.createArrayNode();n.forEach(v->out.add(resolveReferences(v,p,ids)));return out;}return n;
    }
    private static void map(List<JsonNode> mapping,String temp,String kind,UUID id,String action) {mapping.add(node("tempId",temp,"kind",kind,"id",id.toString(),"action",action));}
}
