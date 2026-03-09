package com.controlefinanceiro.api.domain.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findAllByCategoryId(UUID categoryId);

    // Soma total por tipo e ano
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND EXTRACT(YEAR FROM t.date) = :year")
    BigDecimal sumByTypeAndYear(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("year") Integer year);

    List<Transaction> findByUserIdAndDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    @Query(
            value = "SELECT t FROM Transaction t JOIN FETCH t.account LEFT JOIN FETCH t.category WHERE t.user.id = :userId",
            countQuery = "SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId"
    )
    Page<Transaction> findAllByUserIdWithDetails(@Param("userId") UUID userId, Pageable pageable);

    // Soma por dia (para o gráfico de 30 Dias)
    @Query("SELECT t.date, t.type, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.date >= :startDate GROUP BY t.date, t.type")
    List<Object[]> sumAmountByDateAndType(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);

    // Soma por mês (para os gráficos de 6 Meses e 1 Ano) - O Hibernate 6 lida perfeitamente com EXTRACT no Postgres
    @Query("SELECT EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.date >= :startDate GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date), t.type")
    List<Object[]> sumAmountByMonthAndType(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);

    @Query("SELECT t.type, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId GROUP BY t.type")
    List<Object[]> sumTotalAmountByType(@Param("userId") UUID userId);

    @Query("SELECT t.type, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.date BETWEEN :startDate AND :endDate GROUP BY t.type")
    List<Object[]> sumAmountByTypeAndDateBetween(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query(
            value = "SELECT t FROM Transaction t JOIN FETCH t.account a LEFT JOIN FETCH t.category c " +
                    "WHERE t.user.id = :userId " +
                    "AND t.date >= :startDate AND t.date <= :endDate " +
                    "AND (CAST(:type AS text) IS NULL OR t.type = :type) " +
                    "AND (CAST(:accountId AS uuid) IS NULL OR a.id = :accountId)",
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