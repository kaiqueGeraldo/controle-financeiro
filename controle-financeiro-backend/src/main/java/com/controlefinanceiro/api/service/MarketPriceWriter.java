package com.controlefinanceiro.api.service;
import com.controlefinanceiro.api.domain.investment.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
/** Quote network requests finish before this local, guarded write transaction. */
@Service
public class MarketPriceWriter {
    private final InvestmentRepository investments;private final FinancialInventoryGuard guard;private final Clock clock;
    public MarketPriceWriter(InvestmentRepository investments,FinancialInventoryGuard guard,Clock clock){this.investments=investments;this.guard=guard;this.clock=clock;}
    @Transactional
    public void update(UUID owner,UUID id,BigDecimal price) {
        guard.writer(owner);
        investments.findOwnedForAllocation(id,owner).ifPresent(asset->{
            if(asset.getPositionMode().equals("UNIT")) {asset.evaluate(price,LocalDate.now(clock),"BRAPI");investments.save(asset);}
        });
    }
}
