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

    interface Source { UUID getAccountId(); UUID getCounterpartyId(); UUID getOperationId(); }
    // Scalar projection avoids caching a stale ledger/account entity before waiting for its lock.
    @Query("SELECT t.account.id AS accountId, t.counterpartyAccountId AS counterpartyId, t.operationId AS operationId FROM Transaction t WHERE t.id=:id AND t.user.id=:userId")
    java.util.Optional<Source> findOwnedSource(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT t.account.id FROM Transaction t WHERE t.operationId=:operationId AND t.user.id=:userId ORDER BY t.account.id")
    List<UUID> operationAccountIds(@Param("operationId") UUID operationId,@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(t.amount),0) FROM Transaction t WHERE t.reversalOfId=:id")
    BigDecimal sumReversals(@Param("id") UUID id);

    @Query(value="SELECT reversal_of_id, SUM(amount) FROM transactions WHERE reversal_of_id IN (:ids) GROUP BY reversal_of_id",nativeQuery=true)
    List<Object[]> reversedTotals(@Param("ids") List<UUID> ids);

    @Query(value="""
        SELECT COALESCE(t.settlement_of_id, o.settlement_of_id),
               SUM(CASE WHEN t.origin='REVERSAL' THEN -t.amount ELSE t.amount END)
        FROM transactions t LEFT JOIN transactions o ON o.id=t.reversal_of_id
        WHERE (t.settlement_of_id IN (:ids) OR o.settlement_of_id IN (:ids))
          AND t.status IN ('SETTLED','REVERSED')
        GROUP BY COALESCE(t.settlement_of_id, o.settlement_of_id)
        """,nativeQuery=true)
    List<Object[]> settledTotals(@Param("ids") List<UUID> ids);

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
              AND (t.origin IS NULL OR t.origin NOT IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT))
              AND EXTRACT(YEAR FROM t.date) = :year
            """)
    BigDecimal sumByTypeAndYear(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("year") Integer year);

    // Resultado gerencial: principal de investimento e transferências são movimentos
    // patrimoniais; pagamentos de fatura e abertura não são novo consumo/renda.
    @Query("""
            SELECT t.type, COALESCE(SUM(CASE WHEN t.origin =
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                THEN -t.amount ELSE t.amount END), 0)
            FROM Transaction t LEFT JOIN Transaction original
              ON original.id = COALESCE(t.reversalOfId,t.correctionOfId) AND original.user.id = :userId
            WHERE t.user.id = :userId AND t.date BETWEEN :startDate AND :endDate
              AND t.status IN (
                com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED)
              AND t.type IN (
                com.controlefinanceiro.api.domain.transaction.TransactionType.INCOME,
                com.controlefinanceiro.api.domain.transaction.TransactionType.EXPENSE)
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                   OR original.id IS NOT NULL)
              AND (CASE WHEN t.origin IN (com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL,
                    com.controlefinanceiro.api.domain.transaction.TransactionOrigin.CORRECTION)
                   THEN original.origin ELSE t.origin END IS NULL
                   OR CASE WHEN t.origin IN (com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL,
                    com.controlefinanceiro.api.domain.transaction.TransactionOrigin.CORRECTION)
                   THEN original.origin ELSE t.origin END NOT IN (
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT,
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVESTMENT_BUY,
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVESTMENT_SELL))
              AND (:type IS NULL OR t.type = :type)
              AND (:accountId IS NULL OR t.account.id = :accountId)
            GROUP BY t.type
            """)
    List<Object[]> sumReportByPeriod(@Param("userId") UUID userId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate,
                                      @Param("type") TransactionType type,
                                      @Param("accountId") UUID accountId);

    // Extrato: soma global do filtro, independente de paginação. Por conta, cada
    // perna da transferência é caixa; no consolidado as pernas se anulam.
    @Query("""
            SELECT t.type, COALESCE(t.transferDirection, original.transferDirection),
                   SUM(CASE WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                       THEN -COALESCE(t.cashAmount, t.amount) ELSE COALESCE(t.cashAmount, t.amount) END)
            FROM Transaction t LEFT JOIN Transaction original
              ON original.id = t.reversalOfId AND original.user.id = :userId
            WHERE t.user.id = :userId AND t.date BETWEEN :startDate AND :endDate
              AND (t.status IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                  com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED)
                   OR (t.status IS NULL AND t.isPaid = true))
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
              AND (t.type <> com.controlefinanceiro.api.domain.transaction.TransactionType.TRANSFER
                   OR COALESCE(t.transferDirection, original.transferDirection) IS NOT NULL)
              AND (CAST(:type AS text) IS NULL OR t.type = :type)
              AND (CAST(:accountId AS uuid) IS NULL OR t.account.id = :accountId)
              AND (CAST(:accountId AS uuid) IS NOT NULL OR t.type <>
                  com.controlefinanceiro.api.domain.transaction.TransactionType.TRANSFER)
            GROUP BY t.type, COALESCE(t.transferDirection, original.transferDirection), t.origin
            """)
    List<Object[]> sumCashByPeriod(@Param("userId") UUID userId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("type") TransactionType type,
                                    @Param("accountId") UUID accountId);

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
              AND (t.origin IS NULL OR t.origin NOT IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT))
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
              AND (t.origin IS NULL OR t.origin NOT IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT))
            GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type
            """)
    List<Object[]> sumAmountByMonthAndType(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);

    @Query("""
            SELECT t.date, t.type, SUM(CASE WHEN t.origin =
                com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                THEN -COALESCE(t.cashAmount, t.amount) ELSE COALESCE(t.cashAmount, t.amount) END)
            FROM Transaction t WHERE t.user.id = :userId AND t.date >= :startDate
              AND t.type IN (com.controlefinanceiro.api.domain.transaction.TransactionType.INCOME,
                             com.controlefinanceiro.api.domain.transaction.TransactionType.EXPENSE)
              AND t.status IN (com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                               com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED)
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY t.date, t.type
            """)
    List<Object[]> sumCashByDateAndType(@Param("userId") UUID userId,
                                         @Param("startDate") LocalDate startDate);

    @Query("""
            SELECT EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type,
                   SUM(CASE WHEN t.origin =
                       com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL
                       THEN -COALESCE(t.cashAmount, t.amount) ELSE COALESCE(t.cashAmount, t.amount) END)
            FROM Transaction t WHERE t.user.id = :userId AND t.date >= :startDate
              AND t.type IN (com.controlefinanceiro.api.domain.transaction.TransactionType.INCOME,
                             com.controlefinanceiro.api.domain.transaction.TransactionType.EXPENSE)
              AND t.status IN (com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                               com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED)
              AND (t.origin IS NULL OR t.origin <> com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING)
            GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type
            """)
    List<Object[]> sumCashByMonthAndType(@Param("userId") UUID userId,
                                          @Param("startDate") LocalDate startDate);

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
              AND (t.origin IS NULL OR t.origin NOT IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT))
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
              AND (t.origin IS NULL OR t.origin NOT IN (
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.ACCOUNT_OPENING,
                  com.controlefinanceiro.api.domain.transaction.TransactionOrigin.INVOICE_PAYMENT))
            GROUP BY t.type
            """)
    List<Object[]> sumAmountByTypeAndDateBetween(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.operationId = :operationId ORDER BY t.id")
    List<Transaction> findOperationForUpdate(@Param("operationId") UUID operationId);

    boolean existsByReversalOfId(UUID reversalOfId);

    @Query("SELECT t FROM Transaction t WHERE t.goalItemId = :goalItemId AND t.user.id = :userId "
            + "AND t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.GOAL_PURCHASE")
    java.util.Optional<Transaction> findGoalPurchase(@Param("goalItemId") UUID goalItemId,
                                                      @Param("userId") UUID userId);

    boolean existsBySettlementOfId(UUID settlementOfId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.id = :id AND t.user.id = :userId")
    java.util.Optional<Transaction> findOwnedForUpdate(
            @Param("id") UUID id,
            @Param("userId") UUID userId);

    @Query("""
            SELECT COALESCE(SUM(CASE WHEN t.origin = com.controlefinanceiro.api.domain.transaction.TransactionOrigin.REVERSAL THEN -t.amount ELSE t.amount END),0)
            FROM Transaction t LEFT JOIN Transaction original ON original.id=t.reversalOfId
            WHERE (t.settlementOfId=:forecastId OR original.settlementOfId=:forecastId)
              AND t.status IN (com.controlefinanceiro.api.domain.transaction.TransactionStatus.SETTLED,
                               com.controlefinanceiro.api.domain.transaction.TransactionStatus.REVERSED)
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
