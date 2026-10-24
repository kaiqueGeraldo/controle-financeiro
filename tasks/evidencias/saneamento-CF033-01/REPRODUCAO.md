# Causa e prova original

A prova independente original foi executada **antes de qualquer correção de produto**.
Arquivo `Cf033ProgressIndependenceProbeTest.java`, SHA256:
`C91456DAC4F843AC86FFC11A6CF1516E9CCEA7562D2FFF2A9409E06D781212D4`.
As assertions, limites e critério desse arquivo permanecem byte a byte iguais.
O teste histórico CF024 e o probe financeiro1200 também constam do manifesto inicial.

## Estado e interleaving

PostgreSQL16.15 descartável, iniciado pelo Testcontainers; schema novo, Flyway1–16,
validate. Fixture sintética: owner A com contaA1000, contaB0, posição10 unidades/
custo1000/avaliação1000; owner C com contaC0. Clock de domínio fixo em19/10/2026.
Nenhum dado residual, banco externo, cotação ou email real participa do resultado.

1. T1/conexão própria executa BUY2×100 na contaA dentro de TransactionTemplate,
   mantém a transação aberta e sinaliza a barreira **depois** da operação real.
2. T2/outra conexão inicia INCOME25 na contaB. O observador/terceira conexão aceita
   conclusão imediata ou espera PostgreSQL identificada; não exige que o bug exista.
3. T3/outro owner comita INCOME42,17 antes de T1 ser liberada.
4. Observam-se PIDs, `pg_blocking_pids`, modo/chave de advisory e wait_event.
   Só então se libera o commit de T1 e se conciliam os saldos por SQL independente.

## Antes

[Execução](before-original/execution.json), [locks](before-original/progress-locks.json),
[assertion](before-original/reports/com.controlefinanceiro.api.domain.onboarding.Cf033ProgressIndependenceProbeTest.txt).
Resultado:1 teste/1 falha de assertion/0 erros/0 skips. PID62 tem ExclusiveLock
na chave inventory; PID63 pede ShareLock na mesma chave e espera PID62.
`wait_event_type=Lock`, `wait_event=advisory`, blockers={62}. Mesmo owner bloqueado;
owner C progride42,17. Após liberar: contaA800, contaB25, contaC42,17.

Isso identifica a causa no guard por usuário de BUY. Não foi um timeout genérico,
esgotamento de pool, fixture residual ou perda financeira. O cenário histórico
CF024 exigia INCOME B concluída **antes** de liberar a fonte de BUY.

## Depois e sensibilidade

[Primeira execução](after-delta/progress-locks.json) já mostrou a mesma prova verde:
PID73 mantém dois ShareLocks (dependências e inventário); PID74 já comitou sem
blocker enquanto T1 continuava retida. Contas finais800/25/42,17.
[Seleção restaurada](restored-delta/) reconfere o probe original, progresso de
set/deposit/move, disputa da mesma fonte e dependências/certificação.

[Mutação progresso](mutation-progress/) reintroduziu somente snapshot exclusivo
no BUY da cópia. A assertion original voltou a falhar: bloqueio advisory, sem
erro/skip. [Mutação capacidade](mutation-capacity/) retirou o protocolo completo
apenas de GoalService.setAllocation na cópia. Na janela revalidação→aplicação do
onboarding, o writer real comitou600 e onboarding outros600 em saldo1000. A
assertion histórica esperava600 e observou1200, sem erro/skip. Ambas restauraram
todos os fontes da cópia por SHA256; diffs/manifestos/execution.json preservados.

## Falhas intermediárias preservadas

`regressions`:229 casos,227 passaram/2 assertions falharam. Uma é o orçamento
histórico25→27 SELECTs: exatamente timeout+advisory do novo gate, não N+1. A outra
é timeout da barreira do **probe novo** de BUY com certificado CLOSED válido.
Nenhuma delas foi apagada ou contada como aprovação.

`diagnose-global-buy` fez o observador do probe novo propagar falha do Future antes
da barreira:1 erro por BusinessRuleException de capacidade,0 assertions. Esse erro
nunca foi classificado como contraprova causal eliminada. A consulta EntityManager
de dependências introduzida neste saneamento podia antecipar flush dos metadados
replay do BUY e mudar a versão/inventário antes da validação. O delta final limita
essa consulta a FlushModeType.COMMIT, sem trocar o modo da transação inteira.
O loader de inventário continua JDBC, sem flush antecipado, como no contrato aceito.

Fontes do observador inicial, observador diagnóstico, guard anterior e teste antigo
de queries estão em `diagnosis/*.java.txt`. O orçamento agora é exatamente27,
com a parcela original25 documentada; testes de crescimento/N+1 continuam exatos.
O probe original de progresso não recebeu nenhuma mudança de observador ou critério.

## Reproduzir

Os scripts recusam sobrescrever fases anteriores. `run.ps1` usa exclusivamente
`../controle-financeiro-runtimes/CF-033/saneamento-20261024-01`, preparado pelo
prepare CF033. Para repetir, usar fases novas. O caminho é deliberadamente fixado
para impedir mutação acidental de runtimes históricos.

```powershell
& controle-financeiro-frontend/tests/cf033/prepare.ps1 -RuntimeRoot '../controle-financeiro-runtimes/CF-033/saneamento-20261024-01'
& tasks/evidencias/saneamento-CF033-01/run.ps1 -Phase nova-prova -Sync -Tests 'Cf033ProgressIndependenceProbeTest,Cf033CapacityProtocolTest'
& tasks/evidencias/saneamento-CF033-01/run.ps1 -Phase nova-mutacao-progresso -Mutation progress -Tests 'Cf033ProgressIndependenceProbeTest'
& tasks/evidencias/saneamento-CF033-01/run.ps1 -Phase nova-mutacao-capacidade -Mutation capacity -Tests 'OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication'
& tasks/evidencias/saneamento-CF033-01/run.ps1 -Phase novo-restaurado -Tests 'Cf033ProgressIndependenceProbeTest,OnboardingReviewConcurrencyTest'
& tasks/evidencias/saneamento-CF033-01/run.ps1 -Phase novo-package -Package
```

Na máquina desta execução o runtime já existe: **não** repetir o prepare sobre ele.
Cada execution.json guarda filtros, timestamps, HEAD base, exitCode e restauração.
Manifestos before/mutated/final referem o conteúdo efetivo de fontes, pois o
HEAD ainda não incluía o produto local quando os ensaios foram feitos. Package usa
Maven verify com testes já exercitados, sem clean e sem executar CF034/pipeline remoto.
