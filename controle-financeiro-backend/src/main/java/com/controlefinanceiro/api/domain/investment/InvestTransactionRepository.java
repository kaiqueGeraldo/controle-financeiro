package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface InvestTransactionRepository extends JpaRepository<InvestTransaction, UUID> {
    List<InvestTransaction> findAllByInvestmentIdOrderByDateDesc(UUID investmentId);
}