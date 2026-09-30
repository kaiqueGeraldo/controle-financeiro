# Evidência CF-022 — 30/09/2026

Implementação entregue e validada localmente; estado `em_revisao`. Revisão
independente não executada nesta sessão. Fonte dos expected: CF-022,
SPEC-002/AC-TIME-010 e [DEC-08 aprovada pelo usuário](CONTRATO.md), com exemplos
fixados antes da correção. Não se usou a implementação como oracle.

Base: `6f0d474`; código/contrato/testes: `bb14aa2e91f55db6f6d9c0651ccd65e439096210`.
Branch `main`, somente commits locais. Dependências CF-006/017 integradas e
aptas **para desenvolvimento descartável**, conforme a
[revalidação dirigida anterior](../revalidacao-CF-016-CF-021-residuais/README.md).
Estados de produção/revisão dessas tarefas não foram alterados.
README raiz alheio preservado: SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

Executor: Codex, agente baseado em GPT-6 da sessão atual; esforço efetivo não
exposto. A recomendação de modelo do Markdown não troca a configuração da sessão.
Windows/PowerShell, JDK21.0.12.1, Spring Boot4.0.2, Testcontainers2.0.3,
PostgreSQL16-alpine descartável no Docker Desktop. Node24.18.0, Next16.1.6 e
Playwright1.63.0/Chromium locais já existentes. Schema CF-022 exclusivo,
Flyway V1–V12 e Hibernate validate; V1–V11 não editadas.
Relógios fixos em Brasília; datas sintéticas de 2024 e 2026/2027; namespace/IDs
isolados por UUID, sem saldo compartilhado entre usuários de teste. Mocks somente
Clock, e-mail e cotação externos. Nenhum banco real, e-mail real, push ou deploy.

## Critério → cenário → prova

| Critério | Oracle independente | Testes/provas |
|---|---|---|
| Dia único e progresso reversível | Meta10→11→10; dois hábitos mesmo nome10→12→11; história alheia intocada | `retroactiveUncheckAfterRenameReversesItsExactContribution`, `equalNamesAndDaysAreIndependentContributions`, `persistedHistoryUsesClockAndUncheckRemovesOnlyOwnedEffect`; releituras SQL/JPA |
| Calendário de Brasília | Instante04/01/2027 02:59:59Z ainda domingo; 03:05Z fecha segunda; UI UTC+14 continua enviando04/01 às02:59Z de05/01 | `weeklyWindowUsesProductMidnightInsteadOfJvmCalendar`, consumidores temporais e browser real |
| Semana/ano, diário e perdão | Semana28/12–03/01 com dois checks =1; semana aberta =0; uma ausência conserva1, segunda zera; dias01 e04 não formam sequência | `weeklyCronAcrossNewYearIsIdempotentAfterLockExpires`, `dailyForgivenessAndSecondAbsenceAreStableAcrossRetries`, `twoMissedDaysBreakDailyStreakEvenWhenMarkedRetroactively`, sete testes puros com expected literais |
| Retry, rollback e concorrência | Reprocessar não incrementa; duas ações toggle terminam PENDING/efeito0; mark/cron concorrentes mantêm COMPLETED; meta compartilhada10→12 | `simultaneousToggleActionsSerializeAndPreserveOneDayAndZeroNetProgress`, `cronAndToggleSerializeOnTheSameHabitRow`, `differentHabitsSharingOneGoalSerializeNumericProgress`; PIDs distintos e `pg_blocking_pids` reais |
| Falhas e paginação | Erro não deixa contribuição parcial; hábito inválido não desfaz commits alheios;501 hábitos produzem501 dias únicos | `failedLogInsertRollsBackHistoryProgressAndStreak`, `failureRollsBackOneHabitButCommitsOthersAndRetryIsStable`, `keysetCronTraversesMoreThanOnePageAndRetryKeepsUniqueDays` |
| Operações fora de ordem | Desmarcar04/01 depois de marcar05/01 deixa sequência1, jamais0 | `olderOperationWaitingAcrossMidnightCannotHideNewerCalendarDay`; marcador monotônico `streak_as_of` sob lock |
| Lock/agendamento e legado | Outro nó impede a entrada; próxima execução00:05 Brasília; migração preserva COMPLETED/3/7 e não fabrica vínculo/marker | `schedulerExpressionAndDatabaseLockExcludeAnotherNode`, `v11UpgradePreservesLegacyCalendarAndDoesNotInventGoalIdentity`; base vazia/legada, checksum, rollback/restore e upgrades existentes |

Testes novos em `src/test/java/com/controlefinanceiro/api/domain/habit/`;
consumidores temporais e migrações existentes mantêm suas assertions de conteúdo.
Gate amplo inclui também consumidores de GoalHistory e regras financeiras, sem
apresentá-lo como nova revisão independente de CF-016–021.

## Vermelhos preservados e correções

- [backend-antes.log](backend-antes.log): sete testes, seis falhas de negócio,
  zero erros/skips. WEEKLY_GOAL retornava DAILY; renomear/desmarcar deixava11 em
  vez de10; desmarcar um hábito deixava12 em vez de11; futuro era aceito;
  lacunas contavam2 em vez de1; segundo cron elevava1 para2. Fuso já passava.
- [backend-virada-antes.log](backend-virada-antes.log): expected1, observado0
  após operação antiga terminar depois de uma nova. Correção: não regredir o
  dia da projeção e consultar logs até o maior dia observado sob lock.
- Vínculo `habit_logs.goal_history_id` substitui pesquisa por texto/data;
  `goal_effect_managed=false` preserva a incerteza legada. Nova FK permite
  desfazer histórico/excluir meta sem dupla redução nem apagar calendário.
  `GoalHistory.@CreationTimestamp` sobrescrevia Clock; removida a geração em
  favor dos três pontos de escrita explícitos em HabitService/GoalService.
- [backend-gate-UTC.log](backend-gate-UTC.log): primeiro gate falhou por conflito
  de infraestrutura (create-drop público versus Flyway). Schema exclusivo
  corrigiu a contaminação, sem baseline automático nem mudança de expected.
- [backend-gate-UTC-isolado.log](backend-gate-UTC-isolado.log):272 casos, três
  erros. Fixture nova omitia dark_mode/privacy_mode; V12 pressupunha nome da FK
  da V1, incompatível com fixture Hibernate legada. Fixture completada; V12
  encontra exclusivamente a relação goal_id→goals no catálogo PostgreSQL.
- [backend-virada-depois.log](backend-virada-depois.log):36 casos, uma falha na
  fixture que artificialmente recuava o Clock após já observar o dia seguinte.
  O cenário foi ordenado cronologicamente; expected1 foi mantido. A fixture
  semanal recebeu o mesmo ajuste de ordem, mantendo0→1 na meia-noite.
- [backend-UTC14-final.log](backend-UTC14-final.log):36 casos, quatro falhas e
  um erro porque o helper de expiração gravava horário local em coluna usada
  como UTC pelo provider. Corrigido o helper para `AT TIME ZONE 'UTC'`, sem
  relaxar nenhuma assertion. A rodada corrigida passou36/36.
- [backend-browser-primeiro.log](backend-browser-primeiro.log) e
  [browser-primeiro/playwright.log](browser-primeiro/playwright.log): diário SP
  passou; segundo formulário não ofereceu a mesma meta já vinculada. Ajustado
  setup para uma meta por jornada, preservando todos os expected. Meta
  compartilhada continua verificada no serviço/PostgreSQL. Trace da falha,
  contendo payloads sintéticos de autenticação, fica fora do Git; localização
  e hash em [trace-local.txt](browser-primeiro/trace-local.txt).

## Validação e comandos reproduzíveis

Executar no backend com JDK21 e Docker local disponíveis:

```powershell
$env:JAVA_HOME=(Resolve-Path 'target/temurin21/jdk-21.0.12.1+1').Path
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!HabitBrowserIntegrationTest,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' verify
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitIntegrityIntegrationTest,HabitStreakCalculatorTest,HabitServiceTemporalTest,ScheduledCalendarClockTest' '-Duser.timezone=Pacific/Kiritimati' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitBrowserIntegrationTest' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=HabitIntegrityIntegrationTest#weeklyWindowUsesProductMidnightInsteadOfJvmCalendar+persistedHistoryUsesClockAndUncheckRemovesOnlyOwnedEffect+olderOperationWaitingAcrossMidnightCannotHideNewerCalendarDay,HabitStreakCalculatorTest,HabitServiceTemporalTest,ScheduledCalendarClockTest' '-Duser.timezone=America/Sao_Paulo' test
```

| Execução da validação final | Resultado | Log |
|---|---|---|
| Domínio/HTTP/migrações, JVM UTC, verify/JAR |274/274, zero falhas/erros/skips | [backend-checkpoint-final.log](backend-checkpoint-final.log) |
| Matriz hábitos, JVM UTC+14 |36/36, zero falhas/erros/skips | [backend-UTC14-corrigido.log](backend-UTC14-corrigido.log) |
| Browser da validação final com marcador |4/4 jornadas + pós-condições SQL; um orquestrador Java aprovado | [backend-browser-checkpoint-final.log](backend-browser-checkpoint-final.log), [results](browser/results.json), [Playwright](browser/playwright.log) |
| Contratos temporais, JVM São Paulo |16/16, zero falhas/erros/skips | [backend-SaoPaulo-final.log](backend-SaoPaulo-final.log) |
| Quatro mutações na cópia final |4 falhas causais, zero erros/skips | [mutation-final.log](mutation-final.log), [diff](mutation-final.diff), [restauração](mutation-final-restoration.txt) |

As36 e16 são reexecuções/subconjuntos, não novos casos a somar aos274. O Java
de browser é um orquestrador com pós-condições SQL, não uma quinta jornada.
Rodadas intermediárias13/29/272/273 verdes não substituem o gate final nem
apagam os vermelhos. Mutações executadas na raiz por
`./tasks/evidencias/CF-022/mutate.ps1 -Prefix mutation-final`: Clock sobrescrito,
remoção de lock, incremento semanal acumulativo e retirada do marcador monotônico.
Cada mutação tem detector correspondente; source do checkout intacto e cópia
restaurada por SHA256. Não houve alteração de snapshots, retries, tolerâncias
ou skip/only. As contagens de migração11→12 decorrem da nova V12 explícita;
listas exatas, dados históricos, checksum e assertions de rollback permanecem.

Revisão do código testado conferida pelos hashes de
[fontes/testes/especificação](source-sha256.txt) e do [JAR](jar-sha256.txt).
Após o commit de código, somente estado da tarefa e evidências foram editados.
Inspeção do staging excluiu o README raiz. `git diff --cached --check` apontou
espaços finais emitidos pelas ferramentas nos logs brutos/diffs de mutação;
esses artefatos foram preservados. A checagem dos demais arquivos passou.

Browser real Chromium → Next/BFF → Spring/ORM → PostgreSQL, sem interceptações
de sucesso. Dois fusos de navegador,1440×900, escuro, privacidade desligada;
progresso0→1→0 e releitura após cada reload. Metas são setup HTTP explícito;
criação/marcação/desmarcação de hábitos são UI. Capturas inspecionadas mostram
ofensiva diária1 e semanal1/2, sem sobreposição nesse viewport. A virada do cron,
concorrência e falha são integração backend, sem alegação de cron disparado pelo
navegador. Logs SP/UTC+14 podem mostrar outro dia civil de execução; a data desta
evidência segue o cliente America/Sao_Paulo.

## Trade-offs, riscos e revisão

Recalcular pelo histórico permite corrigir passado e elimina incrementos
duplicados: diário O(L), semanal O(L log W), memória O(L+W), com L logs e W
semanas. Paginação keyset usa IDs ordenados e lote500, sem offset variável nem
count de Page. Removida a varredura quadrática de batchLogs por hábito. Cada
hábito exige transação/lock e consultas próprias; o custo cresce com usuários e
histórico. Isso não é benchmark nem certificação de ausência de N+1. Listagem
ainda carrega logs e specificDays EAGER; CF-025 deve medir consultas/EXPLAIN e
considerar projeções/recálculo incremental com invalidação de correções.

Locks hábito→meta serializam os writers desta tarefa. Falha de um hábito faz
rollback local e erro agregado observável; commits anteriores permanecem.
ShedLock por DB UTC evita entrada simultânea ordinária; expiração/retry ainda
dependem da idempotência do cálculo e locks de linha. Não foi estabelecida ordem
global de todos os domínios nem protocolo durável de intenção de CF-024.

Legado sem identidade exige reconciliação para desmarcar COMPLETED vinculado;
nada foi inferido de nome/data nem backfillado. Recordes são derivados somente
dos logs disponíveis; histórico legado incompleto não está certificado. Cron
materializa ontem; lacunas mais antigas entram no cálculo, sem fabricar logs de
dias em que o scheduler ficou parado. Toggle sem chave/estado desejado não
garante retry HTTP idempotente. SpecificDays sem contrato/DTO, novo módulo de
rotina, reconciliação de produção e auditoria visual completa permanecem fora
desta execução. Versões do backend/SDKs não foram atualizadas; frontend produto não mudou.

Pronta para **revisão independente da CF-022**, com atenção à V12, legado,
Clock de GoalHistory, calendário retroativo e contenção. Não certifica Railway,
adoção real, zoom200%, mobile/claro/privacidade, testes de carga ou outros gates
pendentes das tarefas anteriores. Não há nova tarefa integralmente liberada:
CF-025 depende ainda de CF-021/024, CF-027 de CF-018/019/020/024 e CF-032 de
CF-021/023/024/026/031, além da revisão/aceite da CF-022. Nenhuma seguinte foi iniciada.
