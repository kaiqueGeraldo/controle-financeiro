# Execução atual e aceites reutilizados

15/10/2026. Entrada d806f82; código bcec50c, sem delta posterior de backend.
Comandos iniciais: git status --short, branch --show-current, rev-parse HEAD,
diff --cached --stat, Get-FileHash README.md, log4206d88..HEAD, diffbcec50c..HEAD.
merge-base --is-ancestor retornou0 para4206d88→bcec50c, bcec50c→HEAD,
9fa4fae→HEAD e a7bc256→HEAD. Blobs V1–V14, YAML e fixture preservados.

Nova cópia:
`C:/Users/Aluga.com/.codex/visualizations/2026/10/15/01a14056-9862-7810-9cf7-32f4cd64d172/cf017-confirmation`.
Exportação `git archive --format=tar --output=<cópia>/backend.tar bcec50c controle-financeiro-backend`,
extraída com tar. Probe `../revalidacao-CF-017/Cf017IndependentReviewTest.java`
copiado sem mudanças para o source set de teste dessa cópia. Não é probe novo desta
execução: é prova anterior inspecionada e reexecutada independentemente.

Comando na pasta backend da cópia, JDK21 registrado em
`../revisao-CF-025-CF-027-RV24/runtime-path.txt`:

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,TemporalCompatibilityIntegrationTest,Cf017IndependentReviewTest' verify
```

**verify.log: exit0;75 testes, zero falhas/erros/skips; BUILD SUCCESS/repackage.**
São os71 testes dirigidos mais os4 probes independentes anteriores, agora juntos
em uma execução nova de3min14s. PostgreSQL16.15 descartável; duração não é benchmark.
Docker no sandbox inicialmente retornou permission denied ao consultar versão;
execução de testes com acesso a Docker/cache passou pela revisão automática de
aprovação, sem rejeição e sem alteração dos guards. Não houve tentativa de banco real.

Logs preservam falha intencional Flyway/rollback, restore exit1 após DDL parcial
com targetUnchanged=true, divergências por arquivo/posição e final=EQUIVALENT em
cópia nova. Probe de preflight obsoleto: primeiro0, após FK removida2; baseline
deliberadamente sem gate chega a V14 com FK ausente. Não é aprovação desse fluxo.

Parser `../revalidacao-CF-017/check-manifest.ps1` executado da raiz sem alterações:
manifest.log registra19 tabelas/158 colunas/49 constraints/11 índices. Esse parser
deriva expected do DDL; não chama PgSchemaInventory nem usa fixture como expected.
Inspeção suplementar verifica PK/unique, validade, ações, ausência de sequence/CHECK
na V1 e política de nomes/adicionais. O parser não é validador SQL genérico.

Snapshots before/final copiados do target da nova execução para esta pasta durável:
34 arquivos por lado, igualdade por hash em snapshot-hashes.json. Incluem31 tabelas
com vazias/history, catálogo, sequences e COMPLETE. Não substituem as contraprovas
por campo, framing literal ou análise de conteúdo descritas no parecer.
original-preservation.json reconfere os18 hashes históricos preservados anteriormente.
preservation.json reconfere17 arquivos (14 migrações,2 YAML,fixture) nas três bases.

Reutilizados explicitamente: vermelho original em saneamento-CF-017/original-red.log
(2 falhas causais em3 casos, não reexecutado contra código antigo nesta rodada),
revisão original de setembro e aceites CF-023/CF-028. Fonte temporária do probe de
setembro não existe; não se afirma recuperação. Reexecutados agora os critérios
originais FK ausente/microssegundo e os adversariais do candidato, sem relaxar expected.

Nenhuma falha de teste/harness nova, retry ou mutação de produto. Cópia isolada
preservada; recursos descartáveis pertencem ao Testcontainers/Ryuk. Nenhum descarte
manual. Provas e parecer têm commits separados, com staging explícito; README raiz
permanece fora deles. Estados canônicos preservados, apenas referência de reconferência.

Commit das provas: `4987ea0`. `git diff --cached --check` apontou apenas espaços
finais da saída bruta Maven em verify.log, preservada sem reformatar; checagem dos
demais arquivos passou. O sandbox impediu criar index.lock; staging/commit foram
executados com permissão ampliada aprovada, sem rejeição automática e sem incluir
arquivos alheios. O commit documental seguinte contém este registro e o parecer.
