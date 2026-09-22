# Evidência CF-017 — migrações reproduzíveis e adoção temporal

- Estado da implementação local: **concluída; em revisão**.
- Base inicial: `2269b22` (`docs(CF-016): registrar commit da especificacao`).
- Implementação e testes: `ae494c0be844dc1d7fa3d39073ab2acef2005533` —
  `feat(CF-017): versionar schema e adocao temporal`.
- Dependências reais: CF-002 concluída e PostgreSQL 16 descartável operacional;
  CF-016 concluída no escopo documental nos commits `447581f..2269b22`, sem
  alegação de implementação financeira ou revisão independente.
- Ambiente: Spring Boot 4.0.2, Java 21.0.12.1, Flyway 11.14.1 gerenciado pelo
  parent, PostgreSQL `16-alpine`, Testcontainers 2.0.3 e Docker Engine 29.6.2.
- README raiz: alteração preexistente preservada, SHA-256
  `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
  e excluída dos commits.
- Não houve conexão com Railway, banco real, deploy, push ou exposição de segredo.

## Resultado por critério

| Critério | Implementação e prova local | Estado |
|---|---|---|
| Banco vazio | V1 cria as 19 tabelas, constraints, índices e ShedLock; V2 adota metadados temporais. Spring inicia com `ddl-auto=validate`. | Aprovado localmente |
| Banco legado | Fixture SQL independente representa V1 com UUIDs, valores e relações conhecidos. Preflight recusa tabela/coluna/tipo inesperado; baseline explícita em V1 e V2 aplica uma vez. | Aprovado para a fixture |
| Banco versionado | Segunda chamada de `migrate` executa zero migrações; `validateOnMigrate` e teste de checksum detectam alteração em V2 aplicada. | Aprovado localmente |
| Preservação | Contagens, somas, FKs, precisão de microssegundos e bruto legado são reconciliados. Novas colunas permanecem null no histórico; nem 00:00 nem texto geram proveniência/auditoria. | Aprovado para a fixture |
| Falha e recuperação | V2 mutante adiciona coluna e divide por zero. PostgreSQL/Flyway revertem DDL e history; V2 real reaplica depois sem `repair`. | Aprovado localmente |
| Backup/restore | `pg_dump` por schema, drop e `psql` restore; fingerprint de valores, relações, nulls e histórico Flyway permanece idêntico; novo migrate executa zero. | Aprovado sinteticamente |
| Caminhos temporais | Após upgrade legado e Hibernate validate, PUT preserva bruto sem inventar `recordedAt`; POST distingue 00:00 explícito e grava origem/auditoria. A suíte temporal usa a própria V2. | Aprovado localmente |
| Banco real | Nenhum schema, volume, versão, trilha de origem ou backup Railway foi disponibilizado. | **Não comprovado; bloqueia publicação** |

## Decisões e trade-offs

Foi escolhido Flyway porque Spring Boot 4 possui integração de inicialização e
gerencia a versão 11.14.1; PostgreSQL exige o módulo separado
`flyway-database-postgresql`. V1 é o schema pré-temporal e V2 é aditiva. Banco
vazio executa V1+V2; legado compatível recebe `baseline` explícita em V1 somente
depois de inventário/preflight; banco já versionado segue `migrate` normal.

`baselineOnMigrate=false`, `cleanDisabled=true`, `outOfOrder=false` e
`ddl-auto=validate` são proteções deliberadas. O custo é um passo operacional a
mais na primeira adoção; o benefício é não marcar silenciosamente o banco errado.
Liquibase também resolveria versionamento, mas adicionaria outra DSL/mecanismo sem
vantagem concreta para duas migrações PostgreSQL SQL-first. `ddl-auto=update` foi
removido do perfil local porque não fornece histórico, checksum ou recuperação.

V2 usa DDL transacional e índices normais. Isso torna a falha atômica, porém
`ALTER TABLE` e `CREATE INDEX` adquirem locks; o índice regular pode bloquear
writers durante a varredura e os locks duram até o commit da V2. Em uma amostra
descartável de 20.000 transações, V1 levou 146 ms, V2 20 ms e a consulta limitada
usou `Index Only Scan` com 0,080 ms. São **medições únicas sintéticas**, não
estimativas para produção. Volume, bloat, I/O, transações longas e timeout reais
precisam ser medidos antes de decidir se os índices devem migrar para uma versão
separada `CONCURRENTLY` e não transacional.

## Inventário temporal D16-T01

`UpdatePlanItemDTO.dueDate` já era `LocalDate`, com null explícito rejeitado e
omissão preservada no update. A falha era documental: CT-07 não citava o DTO.
Ao remover esse primeiro bloqueio, o mesmo verificador revelou que
`Transaction.time` TypeScript também não aparecia literalmente em CT-02; ambas
as referências foram acrescentadas. Nenhuma assertion, contagem ou scanner foi
alterado. O verificador original agora cobre 43 campos Java e 16 TypeScript.

## Limites e pendências

- O [inventário versionado](SCHEMA-INVENTORY.md) é do modelo/fixture local, não do
  Railway. Compatibilidade real não pode ser inferida dessa igualdade sintética.
- O [runbook](ROLLOUT-LEGADO.md) exige schema-only dump, volumes, constraints,
  índices, precisão, versão PostgreSQL, writers e backup restaurável reais.
- A fixture prova origem desconhecida. Ela não autoriza backfill futuro nem
  reclassificação por descrição, meia-noite, tipo, timezone ou flag de sistema.
- Revisão independente da implementação e do plano ainda não foi executada; por
  isso CF-017 e a derivada ficam `em_revisao`, não `concluida`.
- CF-018 a CF-024 não foram iniciadas. A baseline espelha o modelo atual e não
  antecipa ledger, dívida, alocação, custo ou idempotência desses domínios.

Referências externas consultadas: [Spring Boot — versões gerenciadas](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html),
[Spring Boot — inicialização com Flyway](https://docs.spring.io/spring-boot/4.2/how-to/data-initialization.html),
[Flyway PostgreSQL](https://documentation.red-gate.com/flyway/reference/database-driver-reference/postgresql-database),
[baseline](https://documentation.red-gate.com/flyway/reference/commands/baseline) e
[risco de baseline-on-migrate](https://documentation.red-gate.com/fd/flyway-baseline-on-migrate-setting-277578974.html).
