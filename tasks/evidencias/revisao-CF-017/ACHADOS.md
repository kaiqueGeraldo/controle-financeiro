# Achados da revisão independente CF-017

## RV17-01 — P1, bloqueia baseline em banco existente

**Local:** `Cf017PostgresSupport.assertLegacyV1Preflight`, linhas 83–117;
`tasks/evidencias/CF-017/README.md`, linha 22; `ROLLOUT-LEGADO.md`, linhas 10–19.

**Reprodução:** em schema descartável, carregar a fixture legada, executar
`ALTER TABLE <schema>.accounts DROP CONSTRAINT accounts_user_id_fkey`, chamar o
preflight e, em seguida, `baseline()` e `migrate()`. O probe temporário passou:
preflight não lançou exceção, Flyway marcou V1 e aplicou V2.

**Observado:** o helper compara a lista de tabelas, quatro tipos/nulabilidades e
a ausência das novas colunas. Não compara as demais colunas, defaults, PK/UK/FK,
checks ou índices. Também está em `src/test`, sem ser o artefato operacional
descrito como “o mesmo preflight” pelo runbook.

**Esperado/critério violado:** schema incompatível deve ser rejeitado **antes** de
uma baseline explícita. A evidência afirma que coluna/tipo inesperado é recusado e
o runbook exige equivalência com V1; uma FK obrigatória ausente contradiz isso.

**Impacto:** uma baseline V1 pode certificar falsamente um schema com integridade
inferior. V2 é aditiva e não corrige a FK; Flyway passa a tratar o banco como
versionado. `Hibernate validate` não deve ser usado como oracle de constraints e
índices.

**Critério de encerramento:** preflight versionado/reproduzível compara todo o
inventário V1 relevante e possui testes adversariais para coluna/tipo/nulabilidade,
default, PK/UK/FK/check, índice e history. O mesmo artefato deve passar em clone
restaurado e no target correto antes da baseline. Não usar `repair` ou
`baselineOnMigrate` para contornar divergência.

**Alcance:** não bloqueia banco vazio local nem o início da CF-018; bloqueia adoção
e baseline em banco existente.

## RV17-02 — P2, oracle parcial de backup/restore sintético

**Local:** `LegacyDatabaseMigrationIntegrationTest`, linhas 100–156;
`tasks/evidencias/CF-017/README.md`, linha 26.

**Reprodução estática:** o fingerprint antes/depois contém contagens e somas de
três tabelas, contagem de relações de transação, quantidade de `recorded_at` null e
quantidade de versões Flyway. Ele não compara IDs/valores linha a linha,
`created_at` bruto, `legacy_created_at_raw`, todos os campos de origem, saldo da
conta, todas as FKs, checks, índices ou definições do schema.

**Observado:** o dump/restore real do schema sintético passou, assim como Flyway
validate e migrate zero. Porém alterações que preservem os agregados do fingerprint
podem escapar do teste. A descrição “fingerprint de valores, relações, nulls e
histórico permanece idêntico” é mais ampla que o oracle implementado.

**Esperado/critério violado:** backup/restore sintético com reconciliação efetiva,
especialmente de dados brutos, null/proveniência, relações e schema.

**Impacto:** confiança excessiva no ensaio sintético; não há evidência suficiente
para reutilizar esse fingerprint como gate de restore real.

**Critério de encerramento:** fingerprint determinístico por PK para os campos
críticos e inventário de constraints/índices/checks, além de contagens por tabela,
saldos e checksums. No ambiente alvo, usar backup restaurável real e reconciliar
amostras/valores por linha conforme o runbook.

**Alcance:** não invalida a aplicação local de V1/V2 e não bloqueia o início da
CF-018; mantém backup/restore real e certificação de adoção pendentes.
