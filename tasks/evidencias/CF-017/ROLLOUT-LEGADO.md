# Runbook CF-017: verificação local e gates de adoção

Revisado em 15/10/2026, delta documental sobre `ef08950`, cadeia **V1–V14**.
Este documento não autoriza banco real. Ensaios anteriores de A/B usaram PostgreSQL
Testcontainers descartável; o delta atual não os repete. [Matriz e representação canônica](../saneamento-CF-017/MATRIZ.md),
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

## Validade do preflight até a baseline — RV17-01/P2

Regra: um resultado completo `CF017_V1=COMPATIBLE`, exit 0, só pode sustentar a
baseline 1 **na mesma janela controlada**, com evidência contínua de identidade,
escopo, versões e condições preservadas. Não tem validade por prazo: timestamp
recente não prova ausência de alteração. Sem evidência suficiente, interromper;
restabelecer os controles e executar novo preflight antes de decidir novamente.

Vincular o relatório a:

* Identidade do recurso/instância e sua geração (criação/restauração), ambiente,
  endpoint/porta, database e schema exatos. Confirmar por registro confiável de
  provisionamento/operação e conexão observada; no descartável, ID do contêiner
  e registro de criação do database. Hostname/IP ou nome de banco isoladamente
  não provam identidade: DNS, proxy e restauração podem manter os mesmos nomes.
* Commit e SHA-256 do inventário `legacy-v1.inventory` e da V1 de referência;
  revisão e hash do artefato efetivamente executado, `catalog.sql`, classpath e
  versões JDK/JDBC/PostgreSQL. Registrar configuração efetiva sem segredos:
  schema/database esperados, papel executor, parâmetros de conexão relevantes,
  search_path, formatação, permissões/visibilidade e versão/configuração Flyway
  destinada à baseline (mesmo alvo/schema, history padrão, baselineVersion=1).
* Ausência de history no legado e continuidade dos controles abaixo desde antes
  do preflight até a confirmação da baseline. O CLI não emite um recibo contendo
  todos esses vínculos: o executor deve compor e conferir o registro operacional.

O gate lê catálogo/semântica V1; não certifica conteúdo de linhas nem estado corrente
de sequences. V1 não possui sequences: uma sequence adicional exige revisão.
Baseline registra uma versão no histórico; não corrige FK, tipo ou outra
incompatibilidade. Aprovação do preflight não autoriza automaticamente migração,
publicação ou liberação de writers.

### Janela controlada e sequência

1. **Identificar** alvo e escopo e conferir preparação/autorização específica da
   operação. Este saneamento não autoriza Railway nem qualquer banco existente.
   Backup restaurável, prova de restore e plano de recuperação aplicáveis devem
   estar aprovados e atuais antes de qualquer baseline; o passo 8 não os adia.
2. **Estabelecer controles antes de verificar:** designar executor único da
   baseline e responsável pela janela; identificar todos os caminhos de DDL,
   migração, restore e administração (aplicação, jobs, pipelines e operadores).
   Suspender esses executores e combinar exclusividade com seus responsáveis;
   registrar início, responsáveis e confirmações de suspensão. Se a suspensão
   não impedir outros acessos de alteração, exigir restrição temporária de
   privilégios/acessos aprovada no plano do ambiente e comprovada pelo responsável.
   Não há comandos nem autorização para alterar permissões nesta tarefa.
   Incluir freeze de writers/nextval quando exigido pelo backup/migração abaixo.
3. **Executar** o CLI preflight acima, mantendo a janela. Não usar relatório de
   outro ensaio. Guardar saída completa, início/fim, exit code e vínculos.
4. **Conferir** identidade, versões, `COMPATIBLE` e exit 0, sem execução parcial
   ou diagnóstico pendente; só então registrar decisão de prosseguir à baseline.
5. **Manter** exclusividade e controles até a baseline: responsável confirma que
   suspensões/restrições continuam vigentes e registra eventos de todos os
   executores identificados. Conferir registros disponíveis de jobs, pipelines e
   intervenções administrativas. Ausência de log isolada não comprova ausência
   de DDL; cobertura desconhecida ou executor não controlado impede prosseguir.
6. **Interromper** na invalidação da matriz. Preservar relatório anterior e causa;
   restabelecer identidade/controles, resolver a causa e repetir o gate. Repetir
   imediatamente antes, sem controlar concorrência, não elimina a corrida.
7. **Registrar baseline explícita 1**, somente em execução futura autorizada e
   usando o Flyway configurado/conferido para esse alvo/schema. Registrar comando,
   versão/configuração, início/fim, saída e resultado; conferir via info e history
   a entrada BASELINE versão 1 bem-sucedida e ausência de migração inesperada.
   Falha/resultado incerto: parar e inspecionar history; não repetir baseline às
   cegas nem usar repair. Após sucesso, o banco é gerenciado: o preflight legado
   não deve passar novamente; usar gates Flyway do fluxo gerenciado.
8. **Seguir gates separados** de backup/restore, migração V2–V14, validação,
   reconciliação e liberação. A janela só termina por decisão registrada do
   responsável após os gates aplicáveis, nunca pelo simples exit 0 do preflight.

Mecanismos existentes: CLI somente leitura, códigos de saída, baseline automática
desabilitada e initializer **de teste** que chama preflight antes de baseline.
Não existe wrapper operacional, bloqueio distribuído ou auditoria DDL contínua
implementados. A transação read-only termina ao fechar o CLI e não protege outra
conexão; o lock do Flyway não protege retroativamente o preflight. Controle depende
da exclusividade operacional demonstrada acima. O custo é uma janela coordenada;
sem meios de assegurá-la, **interromper**, não presumir compatibilidade.

### Matriz de invalidação e exemplos conferidos

“Repetir” abaixo significa parar o avanço, resolver a causa, restabelecer os
controles e produzir novo resultado completo; nunca executar baseline primeiro.

| Evento/cenário | Decisão e justificativa |
|---|---|
| A. Mesmo alvo, versões, resultado aprovado e controles contínuos comprovados | Prosseguir apenas à baseline autorizada; todos os vínculos permanecem válidos. |
| B. Migração ou DDL manual após aprovação, inclusive índice adicional permitido | Invalidar e repetir: a estrutura examinada mudou; a compatibilidade deve ser novamente demonstrada. |
| C. Interrupção e retomada | Com prova contínua de todos os vínculos/controles, reaplicar os critérios de A; sem essa prova, repetir após restabelecer a janela. Relatório recente não basta. |
| D. Outro alvo/database/schema com relatório anterior | Abortar uso do relatório; identificar e autorizar o novo escopo antes de novo preflight. Mesmo hostname não transfere aprovação. |
| E. Banco restaurado/substituído, mesmo nome ou conteúdo alegado | Invalidar: mudou a geração do alvo; conferir identidade, controles e repetir. Backup/restore têm gates próprios. |
| F. Inventário, ferramenta/artefato ou configuração relevante alterados | Invalidar e repetir com versões aprovadas e registradas; inclui papel/permissões, resolução/visibilidade do schema e parâmetros que mudem sua interpretação. |
| Histórico Flyway criado ou alterado | Interromper fluxo legado e investigar; se gerenciado, seguir info/validate/upgrade, nunca nova baseline. Só repetir gate legado se esse estado for comprovado, sem apagar history para fazê-lo passar. |
| G. DML conhecido, apenas em dados de negócio, sem DDL/history ou efeitos indiretos | Não invalida necessariamente o gate estrutural. Registrar natureza/efeitos e verificar gates de dados: neste fluxo, escrita durante freeze de captura/dump ou migração exige parada e repetição das etapas afetadas. |
| nextval/setval, identity ou operação com efeitos em sequences/estado relevante | Não confundir com DDL nem com escrita inócua: estado de sequence não é certificado pelo preflight; invalidar capturas afetadas, pois sequences não são MVCC. Mudança estrutural ou em history também invalida o gate legado. |
| H. Perda/impossibilidade de controlar alterações estruturais ou concorrência de natureza indeterminada | Interromper; não há prova de continuidade. Classificar eventos e restabelecer controle antes de repetir. Se impossível, abortar a janela. |
| I. REVIEW_REQUIRED/“requer revisão”, mesmo sem INCOMPATIBLE | Parar para análise/revisão, exit 2 não autoriza baseline; após resolução aprovada, repetir. Não criar exceção manual ao relatório. |
| INCOMPATIBLE, resultado inconclusivo/incompleto, erro/timeout ou evidência ausente | Parar; investigar e corrigir por plano próprio. Só reconsiderar com evidência e execução completas, exit 0. |

DML pode disparar funções/triggers ou mudar history; só classificá-lo como restrito
a dados se os efeitos forem conhecidos. Para **captura+dump em sessões separadas**,
este runbook exige freeze contínuo de dados, nextval/jobs e DDL. Escrita nesse
intervalo exige novas captura e dump consistentes e nova prova de restore. Um
snapshot exportado estabiliza linhas, mas não sequences. Para **migrações e virada
temporal**, manter writers congelados até validação/reconciliação e coordenação
de versões; aprovação estrutural não certifica dados/proveniência ou coexistência
de writers. Se DML ocorrer fora de um freeze, reavaliar também a atualidade do
backup e o plano de recuperação antes de continuar o fluxo completo.

### Registro mínimo da janela

Manter um registro por tentativa, com executor responsável e referência à
autorização; identidade/geração do alvo sem credenciais; database/schema;
versões/hashes/configuração acima; comandos e parâmetros sanitizados; início/fim
com fuso; saída completa e exit code; controles estabelecidos, seus responsáveis,
confirmações e evidências de continuidade; eventos de invalidação (ou declaração
fundamentada de ausência); decisão **prosseguir/repetir/abortar**, motivo e vínculo
com tentativa anterior. Acrescentar resultado da baseline e conferência de history
quando futuramente realizada, ou “não executada”. Não registrar senhas, tokens nem
strings de conexão com segredos. Guardar evidência real em local de acesso restrito,
fora do Git; falta de evidência é critério de parada, não aprovação tácita.

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

CF-017/P01/P02 permanecem em_revisao. O [parecer vigente](../reconferencia-CF-017/README.md)
mantém código RV17-01 aprovado, RV17-02 encerrado localmente, fundação V1–V14 aprovada
e CF-029 apta exclusivamente local/descartável, sem executá-la. O delta da janela
RV17-01/P2 [aguarda revalidação independente](../saneamento-RV17-01-P2/README.md).
Inventário, compatibilidade, backup/restore, proveniência e coordenação reais seguem pendentes.
