# Execuções CF-024

Raiz inicial `9fa4fae`, staging vazio, somente README raiz alheio. Leitura das
regras/tarefa/dependências antes de edição. Expected em CONTRATO.md antecede
implementação. Data do cliente30/09/2026, America/Sao_Paulo.

| Log | Resultado / distinção |
|---|---|
| before.log | exit1, compilador sem acesso ao cache Maven no sandbox;0 regressões, não prova causal |
| before-runtime.log | exit1;20 testes/9 falhas/0 erros/skips; cache antecipado, repetição econômica e escala do recibo |
| before-notes-lock.log | exit1;2 testes/2 falhas; nota/cache antecipado e timeout PG500 em vez de409 |
| after-1.log | exit0;22/22 |
| expanded-before-deletion.log | exit1;47/2 falhas/0 erros/skips; CF-02429/1 exclusão/cache; migração ainda contava V2–V12 |
| backend-verify.log | exit1;388/1 falha/2 erros/0 skips; target V11→V12 e DI dos dois unitários temporais; CF-02429/29 |
| backend-verify-final.log | exit0;388/388, verify e JAR; CF-02429/29; sem alteração de produto depois deste gate |
| mutation-source-protection.log | exit1;1/1 falha econômica,600 esperado/800 observado;0 erros/skips |
| mutation-idempotence.log | exit1;2/2 falhas econômicas,800/600 e700/400;0 erros/skips |
| mutation-cache-before-commit.log | exit1;7/7 falhas de cache;0 erros/skips |
| mutation-fingerprint.log | exit1;2/2 falhas,409 esperado/200 observado;0 erros/skips |
| mutation-receipt-owner.log | exit1;1/1 falha,404 esperado/200 observado;0 erros/skips |
| mutation-restoration.log | exit0;30/30, incluindo novo deadlock real; cópia restaurada/recompilada, src igual ao checkout por SHA |
| frontend-components-path-error.log | exit1;path Node errado relativo ao cwd, sem teste executado; comando corrigido |
| frontend-components.log | exit0;157/157 em36 arquivos |
| frontend-typecheck.log | exit0;sem diagnósticos |

Não somar388/30 nem reexecuções/mutações; os subconjuntos se sobrepõem. Novo caso
de deadlock foi acrescentado depois de testCompile do gate388 e executado junto
da classe final30 na cópia restaurada; todas as outras classes passaram no gate.
Rollback por trigger retorna500 proposital e não é erro de execução da suíte.
Logs contêm erros sintéticos de banco/controlador que são assertions esperadas.

Preparação de runtime na raiz:

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
```

Invocações Maven usam wrapper local, JDK21, cache Maven e Docker autorizados.
Nenhum banco externo é fallback: o perfil tem URL sentinela e guard descartável.
Não executar dois Maven no mesmo target; a cópia de mutações possui target/banco
próprios. Logs abaixo exemplificam novos nomes para não sobrescrever históricos.

```powershell
# Primeira regressão / conjunto final (o fonte atual tem30 casos).
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf024ConcurrencyCacheIntegrationTest' '-Duser.timezone=UTC' test

# Antes da correção: probes adicionais,2/2 falhas.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf024ConcurrencyCacheIntegrationTest#annualNoteInvalidationAlsoWaitsForCommit+realPostgresLockTimeoutReturnsRecoverable409WithoutWriting' '-Duser.timezone=UTC' test

# Ampliação e migrações.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf024ConcurrencyCacheIntegrationTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,IncrementalMilestoneReviewTest' '-Duser.timezone=UTC' test

# Gate completo; exclui somente orquestradores de browser, não assertions backend.
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!UserIsolationBrowserIntegrationTest,!HabitBrowserIntegrationTest,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' verify

# Mutações, cópia exclusiva sob target e restauração por hash; último run recompila baseline.
& tasks/evidencias/CF-024/mutations.ps1

# Frontend, executado dentro de controle-financeiro-frontend.
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/typescript/bin/tsc --noEmit
```

Um gate completo reproduzido no fonte final executa389 casos (inclui o novo
deadlock), sem afirmar que389 foi a execução registrada. Antes de corrigir,
classes novas/contrato estavam na árvore e produto era9fa4fae; reexecutar o fonte
final não recria os vermelhos. Diffs/commits e logs preservam a cadeia causal.

Unitários temporais: apenas DI do novo colaborador de transporte, sem mudança
dos expected de datas/horários. Migrações gerais enumeram V13 aditiva; teste
específico V11→V12 fixa target12 para conservar o escopo original. A movimentação
da assertion de espera para depois das assertions SQL nos novos testes mantém
todas as verificações e permite que mutação de lock/versão falhe pela integridade.

Depois das assertions, logs publicados são sanitizados de JWT/senhas/códigos
sintéticos, preservando valores financeiros/observações/status. Manifesto guarda
SHA anterior/publicado; alguns caracteres de diagnósticos Java já vieram com
substituição da codificação do Windows e não foram reconstruídos como novo run.
Sem browser/E2E novo, instalação/atualização, notificação real, push ou deploy.

Fechamento local: produto/testes/contrato em `dbf828e`; checkpoint compara os
300 fontes/POM versionados ao commit, com normalização LF explícita. Logs e
diffs preservam bytes publicados por `.gitattributes` local; o manifesto de
sanitização permite conferir os SHA dos logs após checkout. O script de
mutações grava futuras execuções em `target/cf024-mutations-<uuid>/evidence`,
preservando estes artefatos históricos, e compara toda a árvore de fontes.
Esses ajustes finais do script foram validados por parser PowerShell; não
representam uma sexta execução das mutações nem alteram os resultados publicados.
