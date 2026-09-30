# Revisão independente conjunta CF-022/CF-023 — 30/09/2026

**CF-023 aprovada no escopo entregue. CF-022 tem backend aprovado e permanece
em_revisao por RJ-022-01, observação de navegador com causa inconclusiva.
CF-024 apta a iniciar localmente. Publicação continua bloqueada.**

CF-018/020/021 passam a concluida após aceite por critério; CF-016 já estava
concluida. CF-017 e CF-019 conservam em_revisao e suas pendências reais. CF-024
passa de bloqueada a pronta, sem implementação. Os pareceres anteriores e o
bloqueio `9ff1aec` ficam preservados como história, não reescritos como aceites.

## Base e independência

Branch main; HEAD inicial `9ff1aec7c5d4e80eb20458c83b505132bfc3f5f3`,24 commits
locais à frente de origin/main, staging vazio. Intervalos confirmados por
ancestralidade: CF-022 `6f0d474..0219a57`, CF-023 `0219a57..a21ecdb`, bloqueio
documental CF-024 `9ff1aec`. Commits de CF-018 `4203f18`, CF-019 `fb43e62`, CF-020
`d11359e`, saneamentos/resíduos `a752c6e`/`cc089c6`/`0099185` e CF-023 `1b93704`
estão integrados. Ancestralidade sozinha não foi usada como aceite.

Única alteração local inicial: README raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservado byte a byte e fora do staging. Nenhum AGENTS.md adicional encontrado;
instruções fornecidas pelo usuário aplicadas. Recomendações de modelo dos arquivos
não alteram esta sessão. Não foram usados subagentes.

Lidos: execução/política de testes, SDD/specs002/003/004 e contratos financeiros,
CF-016–024 e evidências, contrato DEC-08, contrato DEC-09/matriz/execuções,
revisão original CF-018–021, revalidação do marco e residual, parecer/achados
CF-017 e derivada P01/P02. Oracles vieram dos contratos: semanas segunda–domingo,
progresso10→11→10, duas contribuições independentes10→12→11, contas1000/2300,
ordem7 preservada nas recusas,401/404 uniformes, sem helpers produtivos no expected.
Os diffs e consumidores foram examinados antes da conclusão dos testes.

Ambiente: Windows/PowerShell, JDK21.0.12.1, Maven wrapper, Spring Boot4.0.2,
Docker Engine29.6.2, PostgreSQL16-alpine/Testcontainers, Node24.18.0,
Next16.1.6 e Playwright/Chromium1.63.0 locais. Somente bancos/schemas sintéticos
descartáveis; Clock e fronteiras de e-mail/cotação controlados. Não houve banco
real, comunicação real, push, deploy, instalação/atualização de dependência,
mudança de produto/migração ou início de CF-024+.

## Parecer CF-022

**Backend/calendário/contribuição/migração aprovados; aceite integral pendente.**

| Critério DEC-08 | Confronto e execução independente |
|---|---|
| Diário, perdão, duas ausências, lacunas, recorde e correção | HabitStreakCalculatorTest/HabitIntegrityIntegrationTest; bissexto, ano novo, PENDING do dia aberto, ausência1 versus2, correção de recorde e status derivados. |
| Semanal segunda–domingo/quantidade1–7 | Criação/configuração e fronteiras; semana aberta não incrementa, domingo conta, segunda abre outra semana, configuração/correção preservadas. |
| Marcar/desmarcar e repetição | Linha única por dia, duas ações toggle serializadas dão PENDING/progresso líquido0. Cron repetido após lock liberado conserva ofensiva/logs. Retry HTTP de toggle não é idempotência de intenção: o DTO não contém chave/estado desejado. |
| Efeito numérico identificado | Renomear/retroagir não apaga efeito alheio; hábitos homônimos independentes; troca de meta e desfazer por GoalService não subtraem duas vezes. Meta monetária/futuro/owner alheio recusados sem efeito. |
| Operação atrasada e streak_as_of | Barreira antes do lock e dias consecutivos; operação velha não esconde o dia mais recente. Mutação do watermark falha pela ofensiva esperada1/observada0. |
| Concorrência e rollback | Conexões/PIDs diferentes, pg_blocking_pids observado, disputa toggle/toggle, cron/toggle e dois hábitos/meta. Trigger sintético recusa insert e reverte histórico/progresso; falha de um hábito não desfaz commits de outros. |
| Scheduler/lock efetivo | Probe novo encontra o CronTask específico cujo ScheduledMethodRunnable aponta para o proxy real. Desembrulha somente o OutcomeTrackingRunnable do Spring para identificá-lo; executa o callback original com o worker TaskScheduler, sem chamar o serviço no probe. CronTrigger marca03:05Z/00:05Brasília; outro nó mantém lock e impede escrita, liberação permite processamento, retry mantém uma linha. Remover SchedulerLock faz esse probe falhar. Não se aguardou a meia-noite real do SO. |
| Fusos reais | Startup do app normaliza o default JVM a São Paulo; `-Duser.timezone` sozinho não prova default efetivo diferente. Probes novos alteram/verificam TimeZone após startup para UTC/SP/Kiritimati e restauram ao final. Semana e dois writers de metas preservam calendário/timestamp; browsers SP/UTC+14 também usam Clock fixo. |
| V12, upgrade e validate | Banco vazio V1–V12, fixture legada, upgrades incrementais/V11→V12, reaplicação/checksum/falha/recuperação e Hibernate validate executados. V12 é aditiva; goal_effect_managed=false/goal_history_idNULL/streak_as_ofNULL não inventam contribuição/watermark. FKON DELETESETNULL e FK de hábito→meta são compatíveis com a fixture Hibernate de nome gerado; não alteram V1–V11. |
| Legado sem identidade | Desmarcar COMPLETED legado com meta exige reconciliação explícita; não se procura por texto/data nem se fabrica backfill. Recusa conserva progresso/logs. |
| GoalHistory compartilhado | Inventário real: HabitService.addContribution e GoalService.deposit/recordAllocationChange. Todos fornecem Clock. Probes SQL após commit/reload validam12:00Brasília nos três defaults; suíte345 inclui consumidores financeiros e temporais. |

Browser diagnóstico final: quatro jornadas DAILY/WEEKLY_GOAL em SP/Kiritimati,
UI→Next/BFF→Spring→PG, dia literal04/01/2027, meta0→1→0, ofensivas e registros
após reload, pós-condições SQL Java. Capturas inspecionadas: diário1, semanal1/2,
sem mistura de dias. Isso comprova esses resultados naquela execução; **não
encerra a tentativa semanal anterior sem POST**. RJ-022-01 permanece na CF-022
até classificar a causa e recuperar prova confiável do caminho. Não se declarou
defeito de calendário/PG sem reprodução. [Achados e condições](ACHADOS.md).

## Parecer CF-023

**Aprovada no escopo entregue, com critérios independentes atendidos.**

Principal usa UUID assinado e correspondência de e-mail, com reciclagem de e-mail
recusada; Bearer exige esquema/token únicos.80 pares rota/método reais recusam
as quatro credenciais em320requests401 e snapshot SQL intacto. Isso comprova
autenticação, sem inferir ownership por contagem.50 casos parametrizados de
referência com payload válido comparam B/ausente404 em status/error/message/fields
e snapshots de todas as tabelas, inclusive intenções/recibos; controles próprios
e reorders legítimos continuam funcionando.

Probes novos cobrem lacunas declaradas do relatório anterior: realizations,
quatro referências de moveAllocation, copy-previous e annual-note com ownerB
injetado no corpo. Recibos de pagamentos/comandos, compensações, meta excluída,
exportXLSX, DTO público e recuperação foram executados/reinspecionados. Nenhuma
gravação parcial ocorreu nas recusas; nota/plano de B conservados. O inventário
real e a distinção execução/inspeção ficam na [matriz](MATRIZ-ENDPOINTS.md).

Jornada real de duas abas A/logout/B/reload/404/logout/A/reload passou com API,
cookie, UI e saldosSQL1000/2300. Capturas A/B inspecionadas. Componentes testam
BFF relendo cookie,401versus403, dados/callbacks tardios de A, invalidar lanes,
falhaHTTP sem toast/sucesso fictício e intenções particionadas por owner. Esses
testes com HTTP controlado não são apresentados como navegador/PG.

JWT stateless continua válido por24h após logout/reset quando copiado. Sem
fallback de BroadcastChannel, browsers sem suporte não recebem invalidação
imediata. São limites assumidos em DEC-09, sem exigência nova de revogação/fallback;
não anulam a prova do Chromium nem autorizam afirmar suporte universal.
Não se certifica pentest, carga, exclusão completa de usuário, suspensão de abas,
concorrência de recuperação ou toda combinação de owner/tipo/fonte.

## Poder dos testes e resultados

Fixtures/assertions alteradas nos intervalos foram confrontadas com os contratos:
400→404 é DEC-09 com mensagem exata, mantendo dinheiro/data/tipo próprio e ausência
de efeito; GoalHistory passa a respeitar Clock real, sem remover expected;
V11→V12 atualiza lista exata/contagem/recuperação e conserva dados/checksum;
helpers de lock usam DBUTC e relógios avançam em ordem cronológica. Nenhum
expected, skip, tolerância ou retry foi relaxado nesta revisão.

| Execução | Resultado | Evidência |
|---|---|---|
| Backend da base, verify/JAR, invocaçãoUTC |345/345, zero falhas/erros/skips | logs/backend-base.log |
| Novos probes + afetados, primeira tentativa |132, zero falhas/1erro de identificação do callback | logs/backend-probes.log; harness corrigido, não produto |
| Probe de identificação corrigido + referências de move |5/5 | logs/backend-probe-harness-corrected.log |
| Afetados finais, invocaçãoUTC+14/defaults reais no probe |137/137 | logs/backend-final-UTC14.log |
| Novos probes/contratos finais, invocaçãoSP, inventário real |27/27 | logs/backend-final-SaoPaulo.log; endpoints-401.tsv |
| Componentes |157/157,36arquivos | logs/frontend-components-actual.log |
| Unitários temporais + TypeScript |6por fuso,18execuções; typecheck aprovado | logs/frontend-unit.log; logs/frontend-typecheck.log |
| Browser conjunto, primeira tentativa |Hábitos: falha na navegação de cadastro; isolamento:1jornada aprovada | logs/browser.log; browser/habits; browser/isolation |
| Hábitos após observar login |DiárioSP passou; semanalSP sem POST, processo falhou | logs/browser-habits-synchronized.log; browser/habits-synchronized |
| Hábitos com erro de promises capturável |4/4jornadas e pós-condiçõesSQL; um orquestradorJava | logs/browser-habits-diagnostic.log; browser/habits-diagnostic |
| Sete mutações separadas |7detectadas;10falhas causais, zero erros/skips | mutation-results.json; logs/mutation-*; diffs |
| SchedulerLock contra probe final em worker |1falha causal, zero erros/skips; restaurado | mutation-resultsscheduler-lock.json |

Não somar137/27 à345 ou mutações/reexecuções como novos casos. O teste Java de
browser orquestra quatro jornadas, sem inventar uma quinta. `mutation-first-parser`
preserva o erro de parser do relatório: o log já mostrava1falha por timestamp,
mas o parser achatou Match.Groups; foi corrigido sem alterar teste/expected.
Todos os mutantes foram aplicados um a um em cópia isolada sob target, nunca no
checkout/runtime de produto, e restaurados por hash. Reintroduzem geração
automática de timestamp e removem lock de linha, idempotência semanal,
watermark, ShedLock, UUID do principal e
predicado owner de reorder. [Comandos reproduzíveis](EXECUCOES.md).

## Consolidação e decisão CF-024

O [confronto critério a critério CF-016–023](MATRIZ-ESTADOS.md) explicita por que
CF-018/020/021 concluem seu escopo após os pareceres e RVA-01/02. Não se usou
auditoria futura como obrigação indefinida dessas tarefas. CF-017/RV17-01/02 e
CF-019/RVA-03 não foram fechadas para limpar dependências. Encerramentos anteriores
continuam delimitados; zoom nativo200% e gates transversais/publicação preservados.

**CF-024 apta a iniciar localmente**, em base integrada e PostgreSQL descartável.
CF-018 fornece fontes/abertura/fluxo/rollback; CF-020 fornece capacidade/custo/
compensações/reembolso após RVA-01/02; CF-019 fornece pagamento/intenção/fingerprint/
recibo e dívida sem duplicidade no recorte aprovado; CF-023 agora tem aceite de
principal, ownership, BFF/sessão/recibos. Esses contratos estão definidos e
testados; implementar a matriz de concorrência/cache não exige certificar banco
real ou resolver toda interação do browser previamente.

RVA-03 ocorreu **após** POST200/débito120/pagável0: a pendência observada é
reconciliação/saída visível do modal. Não demonstrou dinheiro perdido, débito
duplicado ou contrato backend indefinido que impossibilite começar transações
separadas/barreiras/rollback/eventos/cache. Pode permanecer investigação rastreada
da CF-019 relacionada à coordenação/reconciliação da própria CF-024. Sua causa
continua inconclusiva, e continua impedindo aceite irrestrito da jornada/publicação.
RJ-022-01 envolve outro fluxo e não é dependência da CF-024. Não foram usados
os rótulos em_revisao para liberar ou negar trabalho indiscriminadamente.

Condições da próxima execução: reconferir HEAD/diffs, ambiente descartável,
contratos de comando/recibo/409 e ordem de locks; testar writers financeiros com
conexões/transações separadas, barreiras determinísticas, estadoPG após ambas,
rollback/eventos/invalidação após commit e mutações. Não encerrar RVA-03 por
retryverde, não reenviar intenção desconhecida com nova chave, não adotar lock
global sem medir, não habilitar cache sem ownership/after-commit. Isso é o trabalho
da CF-024, não uma afirmação de que já foi executado. Estado pronta e histórico
do bloqueio preservado no arquivo da tarefa/evidência CF-024.

## Custos, trade-offs e limites

Recálculo diárioO(L), semanalO(LlogW), memóriaO(L+W); por cron, consultas/locks
por hábito e varredura de seu histórico. Keyset500 evita deslocamento de offset,
mas não elimina custo proporcional ao número de hábitos/logs. DTO de listagem
acessa logs por hábito e specificDaysEAGER: risco de N+1/volume exige medição na
CF-025. Projeções e recálculo incremental precisam invalidar correções retroativas.
Locks hábito→meta preservam contribuição; contenção e ordem global entre domínios
não estão certificadas. ShedLock10min reduz entrada ordinária; expiração exige
idempotência e locks de linha, já exercitados, sem benchmark de duração de job.

Reorder validaO(n), memóriaO(n), consulta em lote e locksUUID ordenados, com até
nUPDATEs; lote grande retém conexão/locks e precisa de limites medidos. Helpers
centralizam ownership/ordem sem transferir cálculo financeiro entre domínios.
JWT stateless simplifica servidor, ao custo da janela de revogação descrita.
BroadcastChannel evita carregar dados sensíveis entre abas, com limite de suporte.
Consultas e cache futuro/concorrência geral continuam CF-024/025, sem afirmação
de ausência total de N+1 ou deadlock. Não houve refatoração especulativa.

Provas/manifestações desta pasta incluem hashes normalizadosLF, sanitização de
JWT/senhas sintéticas nos logs publicados e preservação do README. Trace do
primeiro browser fica em target ignorado, com path/hash em trace-local.json.
Não foram refeitos zoom200%, auditoria visual integral, histórico real/adoção,
benchmark/carga, lint/build globais ou gates de release. Aprovação local de
CF-023/liberação de CF-024 não autoriza CF-025+ ou publicação.

Fechamento: staging explícito inspecionado, sem README raiz ou src/main/Frontend
produto. `git diff --cached --check` integral aponta somente espaços finais
emitidos por ferramentas em logs/diffs de mutação; esses artefatos permanecem
preservados. A checagem de documentação/scripts/testes excluindo logs/diffs passa.
Hashes do checkpoint e o inventário de80 rotas foram conferidos; nenhum processo
de teste permanece ativo. O commit local registra somente testes/probes/evidências
e estados sustentados; nenhum push foi realizado.
