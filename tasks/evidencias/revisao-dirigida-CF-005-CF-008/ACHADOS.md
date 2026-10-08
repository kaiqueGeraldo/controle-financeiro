# Achados dirigidos e condições de encerramento

Base de produto: `1b0d9bcefaba0bcc37a21955caa94db65a3bf383`. Nenhum produto foi corrigido nesta revisão.

## RD58-01 / P2 — ano inicial usa calendário diferente do contrato

- Responsável: CF-005, trabalho original1/3 (auditar consumidores e conformar a CF-004); relação com seleção temporal do critério2. CF-014 recebe o vínculo, sem fechamento geral de tela.
- Arquivo: `controle-financeiro-frontend/src/hooks/useAnnualSummary.ts:14`.
- Contrato: SPEC-002 DEC-01, linha36: seletor anual inicia no ano do navegador e preserva seleção aberta. Diferente do default backend sem query, que usa anoProduto.
- Reprodução: browser/Node UTC, Clock `2027-01-01T01:00:00Z`, renderHook real. Expected literal2027; observed2026. Histórico de introdução: `4d2095a`, trocou `new Date().getFullYear()` por `productDateString` sem alteração dessa regra.
- Evidência: `directed-temporal-review.test.tsx`, `probes-final.log`; controle de ano local passa antes da assertion; controle separado de seleção explícita permanece verde.
- Impacto: abertura do resumo no ano errado durante a divergência de calendário; não demonstra erro em agregação/posição nem vazamento de sessão.
- Encerramento: usar o calendário normativo no default; preservar seleção manual/rascunho; probe original verde, caso de SP/UTC/UTC+14 e virada sem alterar expected. Não exige rever todos os relatórios.

## RD58-02 / P2 — histórico de metas perde identidade do instante e omite origem desconhecida

- Responsáveis: CF-006, trabalho original1/2 (metas/Clock e serialização real), CT-10/E11 de CF-004; CF-005, trabalho original1/3 para consumidor/label. Os checkboxes civis permanecem aceitos nos outros caminhos; isso não substitui entrega de instante do histórico.
- Arquivos: `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/GoalService.java:194` (também359); `domain/goal/GoalHistory.java:27`; `controle-financeiro-frontend/src/components/screens/goals/goalDetails.tsx:764`. GoalController lista a entidade; HabitService também grava GoalHistory, inventariado em J.
- Contrato: inventário temporal CT-10/E11 exige novo GET history date=`2026-09-08T03:10:00Z` e legado local apresentado com “Fuso desconhecido”, sem Z fabricado. SPEC-002 separa horário informado de auditoria.
- Reprodução backend: Clock fixo `2026-09-08T03:10:00Z`, zonaSP; criar meta NUMERIC e POST deposit amount1/time08:15; GET após commit e consulta PostgreSQL descartável. Contagem1; SQL date=`2026-09-08 00:10:00`; response date=`2026-09-08T00:10:00` sem offset, diferente do literal E11. O teste chega à assertion final, sem erro de infraestrutura.
- Reprodução frontend: GoalDetails real com histórico local `2026-09-07T23:30:00`. Nota é renderizada; rótulo “Fuso desconhecido” não existe. Não é screenshot vazio nem erro de import. No caminho conhecido, `new Date`/toLocale sem zona também não estabelece a apresentação contratual de São Paulo.
- Evidência: `DirectedGoalHistoryTemporalTest.java`, `backend.log`, `backend-results.json`, `directed-temporal-review.test.tsx`, `probes-final.log`.
- Impacto: novas gravações continuam indistinguíveis de timestamps locais antigos na API; consumidor trata ambos como hora do browser. Não há demonstração de perda monetária ou de alteração do prazo civil da meta.
- Encerramento: persistir instante/proveniência para novas gravações, DTO/adaptador compatível e apresentação explícita; conservar bruto/null/UNKNOWN das antigas sem inferir origem pelo horário ou timezone atual; testar writers de aporte/alocação/hábito e GET/reload/SQL, legado e três fusos. Migração aditiva local na tarefa dona do schema; adoção remota segue CF-017 com autorização própria. Os três probes devem passar sem alterar seus oráculos.
- Não é reabertura de P01 (InvestTransaction) nem P02 (Transaction/CardTransaction): esses perfis têm provas preservadas. GoalHistory tem contrato próprio E11 e outro caminho. O aceite J validou uso do Clock/12h local, não offset e proveniência do response; ambos os fatos coexistem.

## Limites sem novos bloqueios

CF-007/008: nenhum defeito demonstrado contra seus critérios funcionais próprios, conforme parecer individual. Sem lacuna essencial nova nesses recortes após reutilização justificada. Playwright não executado novamente; cenários históricos identificados, não contados como novos. RD58-01/02 impedem CF-005/006 localmente, sem bloquear CF-028 somente especificação. RV17-01/02, adoção P01/P02, RVA-03, RJ-022-01/H24-01 e frontend visual não foram encerrados nem generalizados.
