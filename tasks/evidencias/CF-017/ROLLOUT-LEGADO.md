# Runbook CF-017: verificação local e gates de adoção

Revisado em 15/10/2026, base integrada `4206d88`, cadeia **V1–V14**. Este documento
não autoriza banco real. O saneamento atual executa somente A/B em PostgreSQL
Testcontainers descartável. [Matriz e representação canônica](../saneamento-CF-017/MATRIZ.md),
[custos e encaminhamento](../saneamento-CF-017/ENCAMINHAMENTO.md).

## Obrigações separadas

A. **Preflight local:** comparar schema legado com V1 antes de qualquer baseline.
B. **Backup/restore local:** restaurar em destino novo e provar equivalência lógica.
C. **Adoção real:** inventário, backup real, proveniência, coordenação de writers,
janela/autorizações, medição e execução no ambiente existente. C continua não autorizada.
Preflight 0 e restore equivalente não são autorização automática de C.

## Pré-condições e identificação

* JDK 21, PostgreSQL/clientes 16, revisão exata da aplicação e migrações imutáveis.
* Para ensaio automatizado, Docker e guard `cf_test_*` loopback; sem fallback remoto.
* Para uso posterior da ferramenta, database esperado e schema são argumentos
  explícitos. Inspecionar host/porta/database/schema por canal seguro, sem publicar
  credenciais. A ferramenta confere o database conectado, schema acessível e major16.
* Conta de leitura com acesso integral às tabelas, catálogos e sequences necessários.
  RLS/ACL não podem ocultar linhas; falha de permissão é parada, nunca aprovação.
* Freeze de todos os writers/nextval/jobs e DDL para captura+dump, especialmente por
  sequences não serem MVCC. Capturas separadas em sessões distintas só são comparáveis
  sob esse freeze. O teste integrado exporta e compartilha snapshot com pg_dump.
* Diretórios de snapshot devem ser novos; proteger dumps/snapshots como dados sensíveis.
  Logs não devem incluir senha/URL com segredos. Não usar banco alvo como scratch.

## Repetir o ensaio autorizado

Na pasta backend, com JAVA_HOME apontando para JDK21 e Docker disponível:

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' `
  '-Dtest=Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,TemporalCompatibilityIntegrationTest' verify
if ($LASTEXITCODE -ne 0) { throw 'Ensaio reprovado; preservar logs' }
```

Não usa clean. Testcontainers cria os recursos e encerra seu próprio contêiner.
O restore usa database novo, criado e registrado pelo próprio teste; não há drop
ou restore por cima da origem. Saída esperada: zero falhas/erros/skips, preflight
0 para legítimos e 2 para incompatíveis, `CF017_ROUNDTRIP ... EQUIVALENT`, todas as
contraprovas detectadas com destino final íntegro. Conferir logs completos.

## Artefato operacional somente leitura

A classe `DatabaseVerificationCli` é independente do bootstrap Spring. O mesmo
`LegacyPreflight` é usado no CLI, testes e initializer de legado. Build/classpath:

```powershell
./mvnw.cmd --batch-mode -DskipTests compile dependency:build-classpath `
  '-DincludeScope=runtime' '-Dmdep.outputFile=target/cf017-classpath.txt'
if ($LASTEXITCODE -ne 0) { throw 'Build falhou' }
$cf017Classpath = 'target/classes' + [IO.Path]::PathSeparator + (Get-Content target/cf017-classpath.txt -Raw).Trim()
$cf017Main = 'com.controlefinanceiro.api.infra.migration.DatabaseVerificationCli'
```

Conexão por `CF017_JDBC_URL`, `CF017_DB_USER`, `CF017_DB_PASSWORD`, injetados pelo
operador sem eco. `$cf017Schema` e `$cf017Database` identificam o alvo previamente
conferido. Estes exemplos são parâmetros, não destinos reais pré-autorizados.

```powershell
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main preflight $cf017Schema $cf017Database
if ($LASTEXITCODE -ne 0) { throw 'STOP: preflight não aprovou; nenhuma baseline/migração permitida' }
```

Exit **0** = legado V1 compatível; **2** = divergência/objeto desconhecido/estado não
legado; **3** = execução/configuração/versão/identificação inválida. Não ignorar
exit code. O programa não contém baseline, migrate ou DDL. O initializer de teste
só executa baseline depois de `assertLegacyV1Preflight`; a matriz prova ausência
de history/migração quando esse gate falha. Não há wrapper operacional que faça
baseline automática. A integração Spring preserva baselineOnMigrate=false,
cleanDisabled=true, outOfOrder=false, validateOnMigrate e Hibernate validate.

## Backup e comparação parametrizados, após identificar origem e destino

Sob freeze verificado, em contexto descartável autorizado (ou futura janela real
com autorização própria), usar variáveis PGHOST/PGPORT/PGDATABASE/PGUSER e PGPASSFILE
protegido para psql/pg_dump/pg_restore. Nenhuma senha na linha de comando. `$cf017Dump`,
`$cf017Before`, `$cf017After` e o banco destino novo são escolhidos pelo operador.

```powershell
psql -X -v ON_ERROR_STOP=1 -c 'select current_database(),inet_server_addr(),inet_server_port(),current_schema(),version()'
if ($LASTEXITCODE -ne 0) { throw 'Identificação falhou' }
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main snapshot $cf017Schema $cf017Database $cf017Before
if ($LASTEXITCODE -ne 0) { throw 'Snapshot incompleto' }
pg_dump --format=custom --schema=$cf017Schema --file=$cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'Backup falhou' }
Get-FileHash -Algorithm SHA256 -LiteralPath $cf017Dump
```

Conferir stderr/warnings também. No teste integrado, pg_dump usa `--snapshot` de
transação exportadora ainda aberta; os comandos manuais acima exigem o freeze,
pois o CLI snapshot encerra a sessão ao retornar. Não compartilhar snapshot expirado.

Criar/verificar **database destino novo** no PostgreSQL descartável. Atualizar as
variáveis PG e CF017 de conexão para esse destino; conferir novamente a identidade.
Não executar `--clean`, drop/recriação, ou restore contra o banco origem.

```powershell
pg_restore --exit-on-error --single-transaction --no-owner --no-privileges --dbname=$cf017RestoreDatabase $cf017Dump
if ($LASTEXITCODE -ne 0) { throw 'Restore falhou; não usar destino parcial' }
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main snapshot $cf017Schema $cf017RestoreDatabase $cf017After
if ($LASTEXITCODE -ne 0) { throw 'Snapshot restaurado incompleto' }
& "$env:JAVA_HOME/bin/java" -cp $cf017Classpath $cf017Main compare $cf017Before $cf017After
if ($LASTEXITCODE -ne 0) { throw 'STOP: restore divergente' }
```

`RESTORE=EQUIVALENT` exige igualdade de todos os arquivos pertinentes. `--list` e
checksum do dump não substituem restauração/comparação. Não omitir campos/arquivos
para aprovar. Conferir preflight no clone legado; em clone já gerenciado, conferir
Flyway info/validate/checksums e migrate zero/upgrade planejado, nunca nova baseline.
Schema vazio usa V1–V14 sem baseline. Não editar migrações aplicadas, não usar repair
ou ddl-auto update para encobrir divergência.

## Critérios de parada e evidências

Parar em objeto obrigatório ausente/divergente, adicional desconhecido, histórico
inesperado, erro/timeout, leitura parcial, arquivo sem COMPLETE, warning de dump/restore
não explicado ou qualquer diferença de snapshot. Preservar origem, dump, hashes,
versões, schema alvo, logs e primeiro relatório; investigar e reprovar gate.
Uma reconciliação nova exige proposta/revisão própria antes de alterar dados/schema.

Guardar base/diff, hashes das migrations/fixture/inventário, identidades sem segredos,
comandos/exit codes, dump checksum/tamanho, inventários/snapshots e contraprovas
isoladas. Não enviar dumps reais ao Git. A [evidência local](../saneamento-CF-017/README.md)
contém somente dados sintéticos e diagnóstico de catálogo, com falhas iniciais mantidas.

## Adoção real e recuperação: continuam fora da execução

Inventariar o ambiente real, dependências/ACL/roles/extensões, volumes/bloat/locks,
proveniência e todos os writers/clientes. Ensaiar backup/restore representativo,
medir a cadeia até V14, revisar independentemente e obter janela/autorização próprias.
Somente então considerar baseline 1 explícita para legado comprovadamente V1,
seguida de V2–V14; banco gerenciado usa upgrade a partir do histórico validado.
Manter writers congelados até Hibernate validate, smoke e reconciliação aprovados.

Antes de novas escritas: preservar falhas e verificar rollback transacional e history;
reexecutar somente após diagnóstico, sem reescrever migration já aplicada. Após novas
escritas: não apagar colunas nem restaurar backup por cima; congelar writers, preservar
original, usar clone separado e correção progressiva em **nova versão posterior à
última aplicada**, nunca “V3” fixo do runbook histórico. Recibos não dispensam inventário
nem garantem replay de todos os writers legados. Não inventar origem/recordedAt.

CF-017/P01/P02 permanecem em revisão. CF-029 não está liberada: precisa decisão
independente sobre a capacidade local consumida e suas demais dependências.