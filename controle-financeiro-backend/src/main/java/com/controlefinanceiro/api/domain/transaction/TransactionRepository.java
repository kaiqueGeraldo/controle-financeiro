package com.controlefinanceiro.api.domain.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findAllByCategoryId(UUID categoryId);

    java.util.Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    // Agregados financeiros incluem apenas realizado, nunca abertura ou previsão.
    // O estorno é uma compensação assinada pela origem, sem apagar o fato original.
    @Query("""
            SELECT COALESCE(SUM(CASE
                WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                    THEN -t.amount
                ELSE t.amount
            END), 0)
            FROM Transaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED
              )
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
              AND EXTRACT(YEAR FROM t.date) = :year
            """)
    BigDecimal sumByTypeAndYear(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("year") Integer year);

    List<Transaction> findByUserIdAndDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    @Query(
            value = "SELECT t FROM Transaction t JOIN FETCH t.account LEFT JOIN FETCH t.category WHERE t.user.id = :userId ORDER BY t.date DESC, CASE WHEN t.time IS NULL THEN 1 ELSE 0 END, t.time DESC, t.id DESC",
            countQuery = "SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId"
    )
    Page<Transaction> findAllByUserIdWithDetails(@Param("userId") UUID userId, Pageable pageable);

    // Soma por dia (para o gráfico de 30 Dias)
    @Query("""
            SELECT t.date, t.type, SUM(CASE
                WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                    THEN -t.amount
                ELSE t.amount
            END)
            FROM Transaction t
            WHERE t.user.id = :userId
              AND t.date >= :startDate
              AND t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED
              )
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY t.date, t.type
            """)
    List<Object[]> sumAmountByDateAndType(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);

    // Soma por mês (para os gráficos de 6 Meses e 1 Ano) - O Hibernate 6 lida perfeitamente com EXTRACT no Postgres
    @Query("""
            SELECT EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type,
                SUM(CASE
                    WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                        THEN -t.amount
                    ELSE t.amount
                END)
            FROM Transaction t
            WHERE t.user.id = :userId
              AND t.date >= :startDate
              AND t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED
              )
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type
            """)
    List<Object[]> sumAmountByMonthAndType(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);

    @Query("""
            SELECT t.type, SUM(CASE
                WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                    THEN -t.amount
                ELSE t.amount
            END)
            FROM Transaction t
            WHERE t.user.id = :userId
              AND t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED
              )
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY t.type
            """)
    List<Object[]> sumTotalAmountByType(@Param("userId") UUID userId);

    @Query("""
            SELECT t.type, SUM(CASE
                WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                    THEN -t.amount
                ELSE t.amount
            END)
            FROM Transaction t
            WHERE t.user.id = :userId
              AND t.date BETWEEN :startDate AND :endDate
              AND t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED
              )
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY t.type
            """)
    List<Object[]> sumAmountByTypeAndDateBetween(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.operationId = :operationId ORDER BY t.id")
    List<Transaction> findOperationForUpdate(@Param("operationId") UUID operationId);

    boolean existsByReversalOfId(UUID reversalOfId);

    boolean existsBySettlementOfId(UUID settlementOfId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.id = :id AND t.user.id = :userId")
    java.util.Optional<Transaction> findOwnedForUpdate(
            @Param("id") UUID id,
            @Param("userId") UUID userId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.settlementOfId = :forecastId
              AND t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.SETTLEMENT
              AND t.status = com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED
            """)
    BigDecimal sumActiveSettlements(@Param("forecastId") UUID forecastId);

    @Query(
            value = "SELECT t FROM Transaction t JOIN FETCH t.account a LEFT JOIN FETCH t.category c " +
                    "WHERE t.user.id = :userId " +
                    "AND t.date >= :startDate AND t.date <= :endDate " +
                    "AND (CAST(:type AS text) IS NULL OR t.type = :type) " +
                    "AND (CAST(:accountId AS uuid) IS NULL OR a.id = :accountId) ORDER BY t.date DESC, CASE WHEN t.time IS NULL THEN 1 ELSE 0 END, t.time DESC, t.id DESC",
            countQuery = "SELECT COUNT(t) FROM Transaction t JOIN t.account a " +
                    "WHERE t.user.id = :userId " +
                    "AND t.date >= :startDate AND t.date <= :endDate " +
                    "AND (CAST(:type AS text) IS NULL OR t.type = :type) " +
                    "AND (CAST(:accountId AS uuid) IS NULL OR a.id = :accountId)"
    )
    Page<Transaction> findFilteredByUserId(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("type") TransactionType type,
            @Param("accountId") UUID accountId,
            Pageable pageable);
}
