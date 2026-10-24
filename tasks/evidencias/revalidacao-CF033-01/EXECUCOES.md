# Execuções, contraprovas e preservação

## Fonte efetivamente executada

Candidato `d059bc92fa8267a8eb4d984373b0ee06bd566889`, intervalo
`8de766f..d059bc9`, sem alterações posteriores de produto. Antes da revisão só
README raiz estava modificado e staging vazio. [Estado inicial](base.json).
Runners novos aceitam runtime por parâmetro e recusam sobrescrever fases.
Runtime desta execução: `../controle-financeiro-runtimes/CF-033/revalidacao-20261024-01`.
Não foi reutilizado nem alterado o runtime `saneamento-20261024-01`.

A cópia contém src/pom/wrappers, sem target antigo, configuração ou credenciais
de banco real. JDK21.0.12.1+1 local, Spring/ORM reais, PostgreSQL16-alpine via
Testcontainers; guard de banco descartável impede fallback externo. Cada JVM
cria database UUID; contextos de onboarding usam schema UUID e migrações V1–V16
com validate. Cada teste cria owner sintético novo. Clock real do domínio é
substituído por Clock fixo em19/10/2026,15:00Z, America/Sao_Paulo; JVM inicia UTC.
Sem navegador nesta rodada backend; MockMvc não abre servidor HTTP externo.
Somente e-mail/cotação externos são doubles; SQL/locks/transações não são mocks.

Os logs identificam a JVM e o diretório executado (baseline PID36752; restaurado
PID41756). JSONs finais dos interleavings registram database/schema, isolamento
READ COMMITTED, timezone PostgreSQL UTC, versão16.15, porta interna5432 e migrações
aplicadas. A porta de host efêmera do container não foi registrada antes da saída;
é fornecida por Testcontainers ao inicializador, sem URL de ambiente real.
Cada comando termina sua JVM; nenhum serviço persistente foi iniciado manualmente.

## Comandos reproduzíveis

Na raiz, PowerShell7; `run.ps1` executa Maven com `--batch-mode`,
`-Duser.timezone=UTC`, `-Dspring.test.context.cache.maxSize=4`, `-Dtest=...`, `test`.
JAVA_HOME vem do JDK21 já existente no target principal, somente leitura.

```powershell
$runtime='../controle-financeiro-runtimes/CF-033/revalidacao-20261024-01'
$runner='./tasks/evidencias/revalidacao-CF033-01/run.ps1'
# A preparação inicial foi feita pelo corpo equivalente deste script:
./tasks/evidencias/revalidacao-CF033-01/prepare.ps1 -RuntimeRoot $runtime
& $runner -RuntimeRoot $runtime -Phase baseline -Tests 'Cf033ProgressIndependenceProbeTest,Cf033GateTransitionReviewTest,Cf033CapacityProtocolTest,Cf033CapacityCostTest,DailyReservationCapacityTest,DailyReservationConcurrencyTest,OnboardingReviewConcurrencyTest,CertificationProbeTest'
& $runner -RuntimeRoot $runtime -Sync -Phase mutant-progress -Mutation progress -Tests 'Cf033ProgressIndependenceProbeTest'
& $runner -RuntimeRoot $runtime -Phase mutant-capacity -Mutation capacity -Tests 'OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication'
& $runner -RuntimeRoot $runtime -Phase mutant-phantom -Mutation phantom -Tests 'Cf033GateTransitionReviewTest#dependencyCannotCommitInGapAfterLocalClassification'
& $runner -RuntimeRoot $runtime -Sync -Phase mutant-phantom-proof -Mutation phantom -Tests 'Cf033GateTransitionReviewTest#dependencyCannotCommitInGapAfterLocalClassification'
& $runner -RuntimeRoot $runtime -Phase restored-consumers -Tests 'Cf033GateTransitionReviewTest,Cf033ProgressIndependenceProbeTest,OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication,FinancialIntentsIntegrationTest,Cf024ConcurrencyCacheIntegrationTest#differentWritersShareTheSameAccountWithoutLostMoney+unrelatedAccountCanCommitWhileTheFirstSourceIsHeld+failureWhileSavingReceiptRollsBackLedgerPositionAndCache+receiptOwnerIsolationAndCredentialFailurePreserveMoney+canonicalDecimalsAndDefaultsReplayButCrossKindReuseConflicts'
```

Para nova reprodução, usar nome novo de runtime/fase, sem sobrescrever o histórico.
Baseline usou a versão inicial do novo probe; antes do primeiro `Sync`, acrescentou-se
assertion da mensagem de capacidade e informações de ambiente. Depois do primeiro
mutante phantom, fortaleceu-se o observador para chamar Future.get e registrar
commit concorrente antes de falhar. A [versão anterior](transition-probe-before-completion-proof.java.txt)
foi preservada. Nenhuma assertion foi removida, timeout aumentado ou expectativa
alterada para acomodar o produto. A segunda prova vermelha acrescenta causalidade,
não uma segunda mutação ou tentativa de obter verde. O código final foi revalidado
em `restored-consumers`.

## Resultados novos

| Fase | Resultado JUnit | Regra observada |
|---|---|---|
| baseline |49/49, zero erros/skips |43 controles do saneamento + seis novos interleavings |
| mutant-progress |1 assertion falha, zero erros/skips |BUY volta a snapshot; outra conta espera advisory; expected false, observed true |
| mutant-capacity |1 assertion falha, zero erros/skips |Writer sem guard comita600 durante onboarding600; SQL total1200, expected600 |
| mutant-phantom |1 assertion falha, zero erros/skips |Criador termina enquanto consumidor está pausado depois de false |
| mutant-phantom-proof |1 assertion falha, zero erros/skips |Future concluiu normalmente; SQL mostra um vínculo legado comitado antes da liberação |
| restored-consumers |24/24, zero erros/skips |Seis transições finais, probe original, reserva600,5 contratos de intenção e11 casos CF024 afetados |

49 e24 se sobrepõem em8 identidades JUnit: união65, não73 novos casos.
As execuções vermelhas são três mutações distintas, com duas observações da mesma
mutação phantom. [Inventário nominal](report-inventory.json).
Cada fase registra execution.json, source-before.json e relatórios sanitizados.
Restauração das430 fontes da cópia conferida por SHA256 após todas as mutações;
recompilação do código restaurado registrada antes dos24 controles.

O probe original continua byte a byte com SHA256
`C91456DAC4F843AC86FFC11A6CF1516E9CCEA7562D2FFF2A9409E06D781212D4`.
Sem relaxar seus4s para operação independente,10s para observar estado e15s para
join final. Ele observa ausência de bloqueio/conclusão da outra conta antes de
liberar o BUY; um erro da tarefa ainda falha no get final. Os probes novos também
chamam get quando uma tarefa termina durante a espera: falha não vira progresso.

## Conjuntos entregues pelo saneamento — conferência independente

[Inventário por caso/fase e metadados](historical-reports.json), XMLs originais
preservados em `../saneamento-CF033-01/`:

- before-original:1 falha de assertion, zero erros; probe vermelho no produto antigo.
- after-delta:38 verdes; não se soma aos conjuntos finais.
- regressions:229 executados,227 verdes e2 assertions falhas. Uma era orçamento
 25 versus27 consultas; a outra, barreira do certificado global não alcançada.
- diagnose-global-buy:1 erro BusinessRuleException por certificado invalidado
 pelo autoflush de replay metadata antes da autorização. Preservado; o timeout
 anterior dessa prova não foi atribuído a indisponibilidade genérica.
- restored-delta:43/43; final-regressions:229/229. Sobreposição12, união260.
 Uma das correções foi COMMIT só na consulta de dependências; a outra contabiliza
 exatamente dois SELECTs extras do gate em27, sem afrouxar limite variável.
- final-mutation-progress e final-mutation-capacity:1 assertion pertinente cada,
 zero erros; final-restored-control:2/2. Relatórios intermediários homônimos
 anteriores também permanecem, sem somá-los como novas contraprovas.
- package-verify: Maven `-DskipTests verify` aprovado, enforcer/JDK e JAR Spring
 repackage, sem clean. **Não reexecutou testes nessa fase** e não comprova CI.

O head informado nos runners históricos é8de766f porque rodaram antes do commit
do saneamento. Não são testes do produto antigo: os275 arquivos de produção do
manifesto final são idênticos por SHA256 aos atuais. O primeiro comparador usou
glob `*main*`, que também capturou `domain` de testes e procurou CertificationProbe
no local errado. Saída derivada preservada em
`candidate-source-comparison-initial-path-filter.json`; filtro corrigido para
prefixo literal `src/main/`,275 comparados, zero divergências. Não é falha do
produto nem teste financeiro vermelho.

## Limites e integridade

Não houve falha de produto ou fixture nas duas rodadas positivas desta revalidação.
Não se repetiu toda a revisão CF033, frontend/E2E, nem as229 regressões históricas.
A seleção cobre o delta: progresso, capacidade, gates, writers mistos, ownership,
rollback/recibos/replay e certificação. Contraprovas falharam por regras, sem erro
de importação/compilação/ambiente. Nenhuma execução usa retry ou sleep arbitrário.

Preservação inicial em [preservation-before.json](preservation-before.json);
conferência final em `preservation-final.json`. Inclui627 arquivos: README raiz,
dois probes históricos, evidências do saneamento e fontes/manifesto de seu runtime.
Nenhum clean, reset, descarte, exclusão histórica ou alteração de target principal.
Novos artefatos e caches somente no runtime novo; provas duráveis aqui.
Sem push, merge, deploy, notificações reais, banco real ou execução de sucessoras.
