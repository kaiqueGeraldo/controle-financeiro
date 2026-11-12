package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Quote network requests finish before this local, guarded write transaction. */
@Service
public class MarketPriceWriter {
    private final InvestmentRepository investments;
    private final FinancialInventoryGuard guard;

    public MarketPriceWriter(InvestmentRepository investments, FinancialInventoryGuard guard) {
        this.investments = investments;
        this.guard = guard;
    }

    @Transactional
    public void update(UUID owner, UUID id, BigDecimal price, LocalDate date) {
        guard.writer(owner);
        investments.findOwnedForAllocation(id, owner).ifPresent(asset -> {
            LocalDate previous = asset.getValuationDate();
            if (!"UNIT".equals(asset.getPositionMode()) || (previous != null && date.isBefore(previous))) return;
            if (date.equals(previous) && asset.getCurrentPrice() != null
                    && price.compareTo(asset.getCurrentPrice()) == 0) return;
            asset.evaluate(price, date, "BRAPI");
        });
    }
}
