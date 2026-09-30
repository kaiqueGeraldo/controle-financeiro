package com.controlefinanceiro.api.domain.transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface FinancialCommandRepository extends JpaRepository<FinancialCommand,UUID> {}
