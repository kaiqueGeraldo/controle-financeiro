package com.controlefinanceiro.api.domain.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(UUID userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.isArchived = false")
    BigDecimal sumTotalBalanceByUserId(@Param("userId") UUID userId);
}