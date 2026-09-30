# Comandos e limites de reprodução

Executados na revisão em30/09/2026, data do cliente America/Sao_Paulo.
Logs de processos UTC+14 podem mostrar01/10; não é outra data de aceite.
As suítes começam com dados sintéticos e bancos/schemas Testcontainers novos.
Não usar banco real nem email/cotação externos. Docker Desktop local é requisito;
nenhuma URL externa é fallback do harness.

No backend, preparar:

```powershell
$env:JAVA_HOME=(Resolve-Path 'target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
```

A localização dos runtimes é desta máquina. Adaptar paths de instalação sem
alterar classes/assertions; outputs devem ir para uma pasta nova para preservar
os resultados publicados. Não executar dois Maven no mesmo target nem dois Next
na mesma `.next`; mutações têm cópia própria e podem usar outro banco descartável.

## Gates backend

```powershell
# Base original:345 testes, verify/JAR. Exclui apenas orquestradores de browser.
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!UserIsolationBrowserIntegrationTest,!HabitBrowserIntegrationTest,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' verify

# Afetados finais:137 testes. Inclui os probes novos e validação Flyway/JPA.
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitIntegrityIntegrationTest,UserIsolationIntegrationTest,HabitStreakCalculatorTest,HabitServiceTemporalTest,ScheduledCalendarClockTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,IncrementalMilestoneReviewTest' '-Duser.timezone=Pacific/Kiritimati' test

# Probes finais São Paulo:27; gera80 pares registrados/privados com prova401.
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitIntegrityIntegrationTest#independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock+independentRuntimeDefaultZoneCannotMoveTheProductWeek,UserIsolationIntegrationTest#independentGoalWritersPersistProductClockAfterReload+independentAllocationMoveRejectsEveryForeignReferenceBeforeWriting+independentRealizationForeignAndMissingAreUniformAndDoNotWrite+independentNoteAndCopyPreviousUsePrincipalInsteadOfInjectedOwner+everyPrivateMappingRejectsMissingMalformedInvalidAndExpiredTokens,HabitStreakCalculatorTest,HabitServiceTemporalTest,ScheduledCalendarClockTest' '-Duser.timezone=America/Sao_Paulo' '-Dcf023.inventory=../tasks/evidencias/revisao-CF-022-CF-023/endpoints-401.tsv' test
```

O primeiro comando executado antes dos novos probes tinha345 casos. Uma repetição
no checkout final inclui13 casos adicionais, portanto358, sem prometer que358
foi o run desta revisão.137/27 são subconjuntos sobrepostos/reexecuções, não soma
de novas regressões. Startup normaliza TimeZone aSP; os probes independentes
mudam e verificam o default após startup para exercitar realmenteUTC/SP/Kiritimati.

Tentativas anteriores preservadas: backend-probes132 teve1erro de identificação
de wrapper; backend-probe-harness-corrected5 passou. O arquivo fonte do probe
foi corrigido para identificar o callback específico, e o gate final executa
TaskScheduler/lock real. Nenhum produto/assertion financeira mudou.

## Browser

```powershell
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitBrowserIntegrationTest,UserIsolationBrowserIntegrationTest' '-Duser.timezone=UTC' '-Dcf022.evidence=../tasks/evidencias/revisao-CF-022-CF-023/browser/habits' '-Dcf023.evidence=../tasks/evidencias/revisao-CF-022-CF-023/browser/isolation' test

# Executado após observar login; diárioSP passou, semanalSP sem POST.
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitBrowserIntegrationTest' '-Duser.timezone=UTC' '-Dcf022.evidence=../tasks/evidencias/revisao-CF-022-CF-023/browser/habits-synchronized' test

# Executado após capturar corretamente rejection de click/response.
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitBrowserIntegrationTest' '-Duser.timezone=UTC' '-Dcf022.evidence=../tasks/evidencias/revisao-CF-022-CF-023/browser/habits-diagnostic' test
```

Hoje os comandos usam o harness final; não devem recriar o primeiro erro nem
sobrescrever provas. A primeira versão do harness está em `git show 9ff1aec:.../browser.cjs`;
o diff da revisão registra login observado/Promise.all/captura terminal.
Jornada de isolamento passou já no primeiro run; hábito tem as tentativas
distintas no parecer, sem retry automático. RJ-022-01 não foi encerrado pela
execução diagnóstica verde. Nenhum endpoint financeiro foi interceptado com
sucesso falso. Setup de metas é HTTP declarado, ações de hábito são UI, SQL
Java é após reload. Clock/browser e servidor são sintéticos/controlados.

Trace do primeiro erro guarda payloads sintéticos de autenticação: movido com
path absoluto conferido para target ignorado, SHA em browser/habits/trace-local.json.
Não versionar traces de auth; em futuras falhas preservar localmente e publicar
somente localização/hash e logs sanitizados. Nenhum trace posterior foi gerado
na tentativa que morreu por promise não capturada.

## Frontend e contraprovas

No frontend:

```powershell
& 'C:/Program Files/nodejs/npm.cmd' run test:component
& 'C:/Program Files/nodejs/npm.cmd' run test:unit
& 'C:/Program Files/nodejs/npm.cmd' run typecheck
```

A tentativa `npm` viaPATH falhou porque um shim global apontava para npm-cli.js
ausente; não iniciou testes. O executável instalado explícito passou157/157 e
18execuções temporais, TypeScriptexit0. Esse erro não foi chamado de regressão.
Não foram repetidos build/lint globais, pois não houve edição de produto frontend.

Na raiz:

```powershell
& ./tasks/evidencias/revisao-CF-022-CF-023/mutations.ps1
& ./tasks/evidencias/revisao-CF-022-CF-023/mutations.ps1 -Only scheduler-lock
node tasks/evidencias/revisao-CF-022-CF-023/checkpoint.cjs
```

Mutantes um por vez, sources/pom/wrapper copiados para diretórioUUID sob target.
Não há alteração do produto compartilhado, push ou runtime produtivo. O script
exige Mavenexit1, failures>0, errors=0, skips=0; guarda diff/log/resultado e
restaura bytes em finally, verificando SHA da cópia e fonte compartilhada.
history-clock mostra timestamp do host em vez do Clock; habit-row-lock perde
contenção; weekly-retry incrementa novamente; calendar-watermark perde dia;
scheduler-lock processa apesar de outro nó; signed-principal autenticaB por email;
reorder-owner modifica ordens alheias. Falhas por esses expected/SQL foram lidas,
sem score artificial ou erro de infraestrutura contado como detecção.

Primeira tentativa da mutação history-clock já falhou causalmente1/1; o parser
de resumo registrou0 indevidamente por achatamento de Match.Groups. Log e JSON
anteriores conservados, parser corrigido e contraprova reexecutada, sem mudar
produto/fixture/assertion. Sete mutações aprovadas no critério de detecção;
Onlyscheduler-lock revalida o probe final com worker real. Scripts sobrescrevem
os nomes de logs/JSON da pasta de evidências: para repetir, copie a pasta para
um novo nome e adapte `$PSScriptRoot`/raiz, ou preserve as provas antes do run.

Checkpoint executado somente após todos os processos de teste: verifica produto
sem diff contra9ff1aec, README preexistente porSHA, sources normalizadosLF e
sanitizaJWT/senhas/hashes sintéticos nos logs da revisão. Manifesto guarda SHA
original/publicado; não sanitiza produto/testes nem evidências anteriores.
Contagens/status/valores financeiros/assertions foram mantidos. Diagnósticos
com caracteres substituídos de codificaçãoWindows foram preservados.
