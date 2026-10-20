package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

/** Wide exact aggregates; knowledge and individual-operation range are orthogonal. */
public record SummaryAmount(BigDecimal subtotal,boolean hasKnown,List<String> missing,int scale) {
    public static final BigDecimal MONEY_MAX=new BigDecimal("999999999999.99");
    public static SummaryAmount known(BigDecimal n) {return new SummaryAmount(n,true,List.of(),2);}
    public static SummaryAmount empty() {return new SummaryAmount(BigDecimal.ZERO,false,List.of(),2);}
    public static SummaryAmount unknown(String path) {return new SummaryAmount(BigDecimal.ZERO,false,List.of(path),2);}
    public SummaryAmount plus(SummaryAmount other) {
        // Concatenate immutable gap lists in O(1). Copying all prior gaps at every
        // addition makes a large unknown legacy inventory quadratic.
        List<String> gaps=missing.isEmpty()?other.missing:other.missing.isEmpty()?missing:new Paths(missing,other.missing);
        return new SummaryAmount(subtotal.add(other.subtotal),hasKnown||other.hasKnown,gaps,scale);
    }
    public SummaryAmount negate() {return new SummaryAmount(subtotal.negate(),hasKnown,missing,scale);}
    public boolean complete() {return missing.isEmpty();}
    public JsonNode json() {
        String state=complete()?"KNOWN":hasKnown?"PARTIAL":"UNKNOWN";
        String value=subtotal.setScale(scale).toPlainString();
        BigDecimal max=scale==8?new BigDecimal("999999999999.99999999"):MONEY_MAX;
        return node("state",state,"value",complete()?value:null,"knownSubtotal",complete()||hasKnown?value:null,
                "outsideIndividualRange",complete()||hasKnown?subtotal.abs().compareTo(max)>0:null,"missingPaths",new TreeSet<>(missing));
    }
    public static JsonNode na() {return node("state","NOT_APPLICABLE","value",null,"knownSubtotal",null,"outsideIndividualRange",null,"missingPaths",List.of());}
    private static final class Paths extends AbstractList<String> {
        private final List<String> left,right;private final int size;
        Paths(List<String> left,List<String> right){this.left=left;this.right=right;this.size=Math.addExact(left.size(),right.size());}
        @Override public int size(){return size;}
        @Override public String get(int index){Objects.checkIndex(index,size);List<String> at=this;int offset=index;
            while(at instanceof Paths p){if(offset<p.left.size())at=p.left;else{offset-=p.left.size();at=p.right;}}return at.get(offset);}
        @Override public Iterator<String> iterator(){
            return new Iterator<>() {
                final Deque<List<String>> pending=new ArrayDeque<>(List.of(Paths.this));Iterator<String> current=Collections.emptyIterator();
                @Override public boolean hasNext(){while(!current.hasNext()&&!pending.isEmpty()){
                    List<String> next=pending.pop();if(next instanceof Paths p){pending.push(p.right);pending.push(p.left);}else current=next.iterator();
                }return current.hasNext();}
                @Override public String next(){if(!hasNext())throw new NoSuchElementException();return current.next();}
            };
        }
    }
}
