package com.controlefinanceiro.api.domain.investment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface InvestmentValuationRepository extends JpaRepository<InvestmentValuation,UUID> {}
