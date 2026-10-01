# Pendências únicas e condições de encerramento

Snapshot de 01/10/2026, base `c7f7ffc`. Os estados oficiais permanecem nas
tarefas individuais. Donos abaixo são as tarefas/papéis já responsáveis, sem
transferência para limpar status. Cada ID é interpretado dentro do parecer
que o originou: R01 da revisão CF-001–009 não é R01 da revisão CF-015.
Não foram realizadas correções nem novas verificações técnicas nesta consolidação.

## Defeitos, intermitências e adoção ainda abertos

| ID / classificação | Responsável e alcance | Evidência vigente | Condição objetiva / verificação dirigida |
|---|---|---|---|
| P01/P02 — adoção temporal incompleta | CF-017/derivada; CF-005/006/007/008 para seus consumidores e aceite final | [Derivada temporal](../../03-integridade/CF-017-P01-P02-adocao-temporal.md), [revisão CF-017](../revisao-CF-017/README.md), posteriores V12/V13 | Inventário real de schema/volumes/proveniência, backup restaurável e restore conciliado, writers/clientes coordenados, plano de reversão e validação dos consumidores do ambiente alvo. Desconhecido mantém bruto/null; não inferir origem. Não bloqueia automaticamente ambiente descartável. Nenhum acesso real autorizado nesta consolidação. |
| RV17-01 — P1 confirmado, preflight insuficiente | CF-017; impede baseline em banco existente | [Achado e FK removida](../revisao-CF-017/ACHADOS.md) | Preflight versionado compara colunas/tipos/null/defaults/PK/UK/FK/check/índices/history; adversariais rejeitam incompatibilidades antes da baseline. Mesmo artefato em clone restaurado e alvo autorizado. Flyway/Hibernate verde isoladamente não encerra. |
| RV17-02 — P2, oracle de restore parcial | CF-017; impede certificar preservação integral | [Achado e limites](../revisao-CF-017/ACHADOS.md) | Fingerprint determinístico por PK/campos críticos, bruto/null/origem, saldos, relações e schema/checks/índices; backup/restore real conciliado quando autorizado. Somas e contagens equivalentes são insuficientes. |
| RVA-03 — P2, intermitência de causa inconclusiva | CF-019; CF-024 participa da coordenação, CF-020 participa da jornada | [Parecer residual](../revalidacao-CF-016-CF-021-residuais/README.md), [experimento](../revalidacao-CF-016-CF-021-residuais/EXPERIMENTO-RVA-03.md) | Observar passivamente runtime original: POST200/débito120/pagável0 seguido de loading sem recuperação. Identificar fase/causa e demonstrar pagamento único com saída ou recuperação sem novo envio na condição causadora. Experimento sem POST e repetições verdes não explicam o original. Impede aceite irrestrito dessa jornada, sem prova de débito duplicado ou bloqueio geral financeiro. |
| RJ-022-01 — P2, browser semanal inconclusivo | CF-022; consumidor CF-014 | [Achado conjunto](../revisao-CF-022-CF-023/ACHADOS.md) | Capturar click/calllog/DOM/rede com estilos no mesmo runtime; SQL quando houver POST. Distinguir produto/harness e demonstrar causalmente eventual correção, mantendo expected. Quatro jornadas verdes posteriores não encerram a tentativa sem POST. |
| H24-01 — P2 de investigação, scheduler inconclusivo | CF-022; distinto de RJ-022-01 | [Achado na revisão CF-024](../revisao-CF-024/ACHADOS.md) | Reproduzir com fixtures/conexões, pg_stat_activity/pg_locks e barreiras; estabelecer causa ou limite de ambiente; contraprova e gates afetados sem aumentar timeout cegamente. Caso isolado e gate CF-025 verdes não encerram causa. Não há corrupção financeira demonstrada. |
| RV24-01 — P1 confirmado no formulário de transação; risco estático no investimento | [Derivada RV24-01](../../01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md), domínio CF-009 com CF-018/020; CF-032 valida jornada | [Duas provas e limites](../revisao-CF-024/ACHADOS.md) | Corrigir decisão de UI após requiresReconciliation: bloquear/reconciliar ou conservar mesma identidade/corpo duráveis. Probe causal passa; resposta descartada após commit + retry deixa único efeito PG; payload diferente rejeitado, intenções novas iguais permitidas. Incluir operação de investimento, reload e perda da identidade. Provas atuais de UI e PG são separadas, não E2E único. Não reabre R03/RV01 do pagamento. |
| RV24-02 — P2 confirmado, exclusão falha por FK | [Derivada RV24-02](../../03-integridade/RV24-02-exclusao-usuario-vinculos.md), identidade/limpeza e domínios financeiros | [Contrato vermelho e rollback](../revisao-CF-024/ACHADOS.md) | Inventariar grafo real de FKs/recibos V13 e herdados; exclusão com pagamento conclui sem órfãos e sem atingir outro owner. Falha intermediária reverte; invalidação após commit; efeitos externos com double. Não presumir que trocar dois deletes resolve todos os vínculos. Rollback/cache corretos não equivalem a sucesso funcional da exclusão. |

## Lacunas de aceite, sem inventar defeitos

Os rótulos abaixo identificam critérios ou tarefas existentes; não são novos
achados de produto. O roteiro deve primeiro confrontar evidência já válida e
executar apenas o que falta, sem repetir auditorias amplas automaticamente.

| Critério / tarefa | Dono | O que falta / condição de encerramento |
|---|---|---|
| R10 / AC-UI-001 — zoom nativo 200% | CF-010, aceite CF-015 | [Roteiro e tentativa](../saneamento-CF-015-RV01/ZOOM.md). Alterar realmente zoom do navegador e observar ações essenciais, texto, scroll e foco; registrar prova e parecer. Viewport de180px não equivale a zoom. Ausência de prova não é defeito confirmado. |
| Aceite final CF-005/006/007/008 | Cada tarefa, coordenação CF-015/017 | P03/P04/P05 já revalidados; não repetir suas correções. Emitir confronto final dos critérios com as evidências temporais locais e P01/P02, distinguindo capacidade local e adoção real. Os pareceres atuais mantiveram em_revisao e não concederam encerramento integral. Não concluir por checkbox nem impor estado dessas tarefas como bloqueio genérico de consumidor explicitamente liberado. |
| Aceite próprio CF-011 | CF-011/015 | R07 está encerrado e sessão foi ampliada na CF-023. Confrontar roteiro de auth/preferências/erros/reload/teclado com provas; completar recuperação ponta a ponta com provedor falso, declarada não executada na revisão CF-015. CF-023 não substitui esse aceite completo. |
| Moeda/privacidade/visual autenticado CF-012 | CF-012/015 | [Revalidação visual](../revalidacao-CF-015/VISUAL.md): não certificou toda matriz de privacidade. Mapear capturas válidas a lista/detalhe, valores extensos e estados; completar lacunas. F-018 não precisa ser reimplementado: o agregado foi aceito em CF-021. |
| Matriz de cartões/planejamento CF-013 | CF-013/015, RVA-03 continua CF-019 | Confrontar estados vazia/aberta/paga/parcial, lista longa/mobile, competência/reload e recuperação com revisões posteriores; completar lacunas próprias, zoom compartilhado e ressalva RVA-03. R03/RV01/R05/R06/R08 encerrados não equivalem a todo esse aceite. |
| Matriz por módulo CF-014 | CF-014/015; achados externos conservam donos | Confrontar meta numérica/monetária/checklist, investimento vazio/histórico, hábito e anual com provas CF-020/021/022. Nota R04 e seleção R01 encerradas; completar critérios não integralmente certificados. RJ-022-01/H24-01 e risco de operationModal/RV24-01 continuam separados. |
| Parecer do marco CF-015 | CF-015 | Completar zoom e aceites pendentes aplicáveis; confrontar achados posteriores com o marco. Não reapresentar como aprovado só porque RV01 foi encerrado em21/09. Liberação parcial para CF-026 continua válida com seus limites. |
| Revisão independente CF-025 | Revisor da CF-025, executor fornece evidências | [Entrega](../CF-025/README.md). Examinar EAGER→LAZY e consumidores, causalidade das queries, paginação/posse/dias/logs/locks, SQL/dataset/p95/EXPLAIN e limites. Confirmar critérios com verificação independente proporcional. 396/396 do executor não é aceite; não certificar SLA, heap ou cartões/ativos volumosos sem prova. |
| Aceites de lint/tipagem CF-026 | CF-026 | 23 erros/21 avisos; apenas diagnóstico. Futuramente corrigir por lotes, testar consumidores/cleanup/efeitos, typecheck/build/lint e revisão; sem mascarar com casts/ignores/exclusões. Estado pronta não satisfaz CF-032/034. Nenhuma correção iniciada aqui. |

## Encerramentos preservados e relações entre IDs

| IDs / namespace | Situação demonstrada e evidência de encerramento |
|---|---|
| R01–R16 da revisão CF-001–009 | Corrigidos/revalidados no conjunto final [original](../revisao-CF-001-CF-009/README.md). Não equivalem aos R01–R12 posteriores da CF-015. |
| P03/P04/P05 | Saneamento `8dad1c1..1ced2f0` seguido de [revisão CF-015](../revisao-CF-015/README.md). PUT, relógio do harness e diaProduto revalidados; não encerram P01/P02 nem todas as tarefas. |
| R01/R02/R04/R05/R06/R07/R08/R11/R12 da CF-015 | [Revalidação `681102b`](../revalidacao-CF-015/README.md) encerra os cenários originais. R09 preserva correção anterior do harness. R10 somente recortes visuais, zoom aberto. |
| R03/RV01 da CF-015 | [Revisão dirigida `e4079a9`](../revalidacao-CF-015-RV01/README.md) encerra reconciliação substituída e preserva recuperação sem POST adicional. RVA-03 é observação posterior distinta; RV24-01 é criação sem chave, não pagamento. |
| D16-T01 | [Revisão CF-017](../revisao-CF-017/README.md) valida inventário atualizado: 43 campos Java/16 TS. Não mantém pendência documental antiga por associação ao gate histórico de pom.xml. |
| RVI-01–22, H-01/H-02, NG-01 | [Matriz independente do marco](../revalidacao-CF-016-CF-021/README.md) especifica encerramentos; RVI-07/21 e bordas correlatas dependiam de RVA-01/02, depois encerrados. RVI-11 mantém ressalva integrada RVA-03. NG-01 é decisão já tomada, não ambiguidade aberta. H-01 limita-se à disputa examinada; H-02 ao snapshot de exportação. |
| RVA-01/RVA-02 | [Revisão residual `0099185`](../revalidacao-CF-016-CF-021-residuais/README.md): proporcionalidade/custo residual aprovados; histórico desconhecido preservado. Fundamentam aceite próprio posterior CF-020/021. |
| RVA-04 | [Achado de captura](../revalidacao-CF-016-CF-021/ACHADOS.md): erro de evidência encerrado após esperar opacidade real; não equivale a zoom. |
| F-018 | Critério de total global/filtro da [CF-021](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md) aceito independentemente, com paginação e XLSX. Supera referência antiga a total aberto em CF-012, sem concluir visual/privacidade da tarefa. |
| RJ-H01/RJ-H02 | [Parecer conjunto](../revisao-CF-022-CF-023/ACHADOS.md): identificação de callback e sincronização do cadastro corrigidas no harness; não explicam RJ-022-01 nem H24-01. |

## Limitações e gates preservados

- CF-016: verificador atual/oráculos aprovados; preservação histórica estrita
  permanece vermelha em pom.xml. Evidência histórica não será reescrita nem
  promovida retrospectivamente a verde; não é prova de defeito financeiro atual.
- CF-023: JWT stateless e BroadcastChannel sem fallback são limites contratados.
  Não transformar esses limites em achados novos nem anunciar suporte universal.
- CF-024: L24-01 conserva recibo herdado com resultado vivo, distinto do snapshot
  V13; L24-02 não oferece recuperação durável da invalidação; L24-03 limita
  restart/rede/multidispositivo/cache/carga; L24-04 distingue execuções. Dono de
  futura adoção de cache deve definir/testar recuperação antes de habilitar leitores.
  Sem nova tarefa artificial nem exigência retroativa para concluir DEC-10 backend.
- CF-025: leitura do reorder melhorou no benchmark local; round trips totais,
  UPDATEs e memória continuam O(N). Listas completas/locks/replay/snapshot têm
  custos documentados; nenhuma declaração de capacidade ilimitada ou SLA.
- Homologação integrada e publicação conservam os gates CF-015/017/025/026,
  os achados abertos pertinentes e a cadeia CF-027–036. Não há aprovação implícita
  de adoção real, backup/restore, CI remoto, onboarding ou publicação. Trabalho
  descartável independente usa parecer específico, não uma exceção genérica.

Sequência sugerida, sem execução: revisão CF-025 e preparação futura dos lotes
CF-026 já têm base documental; RV24-01 P1 requer saneamento consumidor com prova
causal própria; as demais investigações/zoom/aceites seguem seus donos. Adoção
real depende de inventário e preservação do ambiente alvo, não de limpar estados.
Não foram criadas arestas de dependência recíprocas entre essas atividades.
