# CF-009 — Corrigir corridas de requisição e mutações otimistas

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-003](../00-fundacao/CF-003-harness-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md)
- Origem: T-003, T-009; F-007

## Saneamento do teto FIN-06 — 04/10/2026

### Decisão independente do candidato01d44d8 — 04/10/2026

**em_revisao mantido, somente critério2 pendente.** O teto monetário anterior
está corrigido; não é mais a justificativa. RVR24-01 mantém falha concreta de
precisão: resultado NG-01 válido é rejeitado e não recupera após commit real;
quantidades divergentes dentro do contrato colidem como Number e ainda produzem
confirmed/removem intenção em probes POST/GET. [Matriz e provas](../evidencias/revalidacao-RVR24-01-teto/README.md),
[payloads e fronteiras da perda](../evidencias/revalidacao-RVR24-01-teto/JSON-PRECISAO.md).
Encerramento exige preservar precisão/resultado original nos caminhos afetados,
passar os seis vermelhos novos e resgate real, mantendo teto/NG-01/lifecycle.
Critérios1/3/4, R01/R02, R03/RV01, RVR24-02/RV24-02 e CF-025–027 preservados.
Nenhuma transferência de critério ou liberação de publicação; CF-028 não executada.

Estado **em_revisao**, somente critério2 aguardando revalidação conforme1e9e932.
O executor acrescentou faixa monetária/escala no validador comum do mesmo
RVR24-01, preservando intenção e recuperação. [Matriz, provas e encaminhamento](../evidencias/saneamento-RVR24-01-teto/README.md).
Critérios1/3/4, RVR24-02, RV24-02 e CF-025/026/027 conservam seus aceites.
Nenhum checkbox alterado; CF-028 não executada. Investigações históricas
permanecem separadas e não são reclassificadas como causa deste veto.

## Saneamento dirigido — 04/10/2026

### Decisão independente da entrega e069e33 — 04/10/2026

**em_revisao mantido. Resta exatamente o critério2 no recorte de falso sucesso
RVR24-01:** bruto1000000000000.00, um centavo acima do teto FIN-06, ainda confirma
e remove intenção em POST/retry/GET. A relação aritmética200→999 está corrigida,
mas não encerra o contrato monetário. [Matriz individual dos quatro critérios](../evidencias/revalidacao-RVR24-01-bruto/README.md)
preserva aceites1 (seleção/rollback),3 (isolamento/dupla chamada) e4 (evidências).
Condição restante: rejeitar teto excedido sem sucesso/descarte, conservar UUID/payload
e recuperação válida; passar quatro novos vermelhos e regressões dirigidas.
R01/R02, R03/RV01 e RVR24-02 permanecem encerrados; H-RV24-01 é investigação
separada, não justificativa vaga para este estado. Sem revisão integral CF-025–027,
implementação CF-028 ou alteração de critérios. [Achado e limites](../evidencias/revalidacao-RVR24-01-bruto/ACHADOS.md).

Estado **em_revisao** mantido. O executor corrigiu a coerência do bruto do
investimento em RVR24-01, com decimal exato/HALF_UP e preservação do amount
autoritativo de NG-01. [Contrato, provas e encaminhamento](../evidencias/saneamento-RVR24-01-bruto/README.md).
O critério de falso sucesso aguarda revalidação independente; nenhum checkbox
recebe autoaceite. RVR24-02, RV24-02 e CF-025/026/027 conservam os aceites de
c45bfb6/40e07ef. CF-028 não executada; investigações históricas preservadas.

## Parecer dirigido por critério — 03/10/2026

Estado **em_revisao** mantido, candidato `06c1a51`. [Matriz dos quatro critérios](../evidencias/revisao-CF-025-CF-027-RV24/MATRIZ.md): aceites R01/R02 e R03/RV01, rollback e isolamento preservados; RVR24-02 callbacks obsoletos encerrado. Critério de erro sem falso sucesso permanece pendente por RVR24-01: total bruto incompatível do investimento ainda confirma/apaga intenção em POST/retry/GET. [Achado e saneamento necessário](../evidencias/revisao-CF-025-CF-027-RV24/ACHADOS.md). H-RV24-01 é investigação de transporte separada, sem causa fechada por verdes novos. CF-026 aceita no lote próprio não conclui esta tarefa; sem nova auditoria integral de telas/adoção.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 1, 2 e 3: a revisão RV24 aceitou o reenvio original identificado; a pendência atual é revalidar RVR24-01 (resultado inválido) e RVR24-02 (callback obsoleto), saneados nesta execução, além de classificar H-RV24-01 ECONNRESET. R01/R02 e R03/RV01 permanecem encerrados. Revisor deve confrontar as cinco provas independentes, lifecycle e SQL/reload sem autoaprovar este saneamento.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

Estado `em_revisao` mantido por pendência concreta posterior:
[RV24-01](RV24-01-criacao-resultado-desconhecido.md) confirma reenvio de criação após
resultado desconhecido, violando AC-UI-009/005. O aceite restaurado em `e4079a9` continua
válido somente para R03/RV01; não certifica todos os consumidores. RVA-03 continua com
CF-019 e não reabre automaticamente R03/RV01. A liberação independente residual em
`0099185` permite CF-026 no recorte de lint/tipagem, com reconferência e testes dos
consumidores, sem concluir CF-009 ou aprovar produção.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Atualizações otimistas e caches podem exibir resposta antiga ou sucesso após falha. Reproduzir concorrência de UI antes de decidir a correção.

## Escopo e referências

- `controle-financeiro-frontend/src/hooks/useOptimisticMutation.ts`
- `controle-financeiro-frontend/src/hooks/useCards.ts`
- `controle-financeiro-frontend/src/contexts/`
- `controle-financeiro-frontend/src/services/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Controlar ordem de respostas e disparar cliques simultâneos, troca rápida de cartão/mês, logout durante fetch e refresh após erro.
2. Corrigir cancelamento/versão de request, propagação de erro e reconciliação com servidor; revisar invalidação por usuário.
3. Usar trava imediata onde necessário, sem tratar bloqueio do botão como garantia de idempotência financeira.

## Aceite e testes adversariais

- [x] Resposta atrasada da seleção anterior não substitui a seleção atual; rollback não apaga mutação posterior válida.
- [ ] Erro não dispara callback/toast de sucesso; nova tentativa funciona; cancelamento não gera erro enganoso. RV01/R03 encerrado na revalidação dirigida de e4079a9. O critério integral permanece pendente por RVR24-01, sem reabrir RV01/R03.
- [x] Cache de usuário A não aparece após login B; dupla chamada é testada e backend continua responsável pela integridade.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Substituir todos os contexts por biblioteca nova; resolver concorrência de banco apenas no navegador.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 09/09/2026 sobre a base local que contém CF-003 e CF-008,
preservando o patch não commitado das tarefas anteriores. A implementação
adiciona coordenação de requests por versão/usuário, cancelamento, cache
segregado, lock síncrono por chave, propagação de erro e rollback local à
entidade. Os testes controlam ordem de resposta, logout/login, duplo clique,
falha tardia, retry e cancelamento.

[Evidência completa](../evidencias/CF-009/README.md), incluindo comandos,
resultados anterior/posterior por mutação, dados sintéticos, complexidade,
trade-offs e limitações. Não houve enfraquecimento de assertions, skips ou
timeouts.

Limites: a validação principal é de componente; não houve E2E integrado de
sessões concorrentes nem teste financeiro contra banco real. O lock O(1) por
chave protege apenas a instância React e não substitui idempotência/serialização
no backend, responsabilidade da CF-024. O Playwright integrado também expôs
uma incompatibilidade preexistente entre o relógio do config e o spec, mantida
registrada sem alteração do teste.

Dependências: nenhuma tarefa nova fica integralmente liberada apenas por esta
conclusão. A CF-015 passa a ter CF-009 satisfeita, mas ainda aguarda
CF-011–CF-014; a CF-026 continua aguardando CF-015. CF-010 e CF-016 já estavam
executáveis por dependências anteriores. Nenhuma tarefa seguinte foi iniciada
nem teve seu estado alterado.


## Revisão independente — 09/09/2026

R03/R09/R10/R11/R12/R13/R14 corrigidos. Rollback testado no provider de hábitos real, callbacks isolados por geração; idempotência de banco e sessões E2E concorrentes não certificadas.

O [parecer da revisão](../evidencias/revisao-CF-001-CF-009/README.md) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

## Parecer independente CF-015 — 14/09/2026

R01/R02 reproduzem respostas obsoletas no retorno a uma seleção em cache. Cenários anteriores de logout/troca de usuário passam, mas não encerram o contrato de seleção.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R01/R02: a seleção invalida requisição antiga inclusive no cache hit. Foram ampliados os cenários A→B→A, sucesso/erro tardio, troca de sessão e desmontagem. A reconciliação financeira aguarda os consumidores afetados.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R01/R02 revalidados com defeitos originais reintroduzidos em cópia isolada. RV01/R03 confirma falha na propagação de erro de reconciliação substituída; aceite de erro reaberto. Estado em_revisao mantido.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).

## Correção dirigida RV01 — 21/09/2026

Cada chamada de reconciliação conserva sua Promise/geração: falha propaga o
erro, cancelamento/substituição rejeita explicitamente e somente lote atual
com leituras concluídas resolve. R01/R02 não foram reabertos. Candidato para
confirmação independente, estado em_revisao mantido:
[contrato, regressões e evidências](../evidencias/saneamento-CF-015-RV01/README.md).

## Confirmação independente de RV01 — 21/09/2026

R03/RV01 encerrado no intervalo f550b9e..e4079a9: teste original intacto,
contraprovas isoladas sensíveis, 41 componentes e jornada integrada aprovados.
Substituição rejeita para o chamador; recuperação não repete pagamento.
Encerramentos de R01/R02 preservados. O aceite reaberto por RV01 foi restabelecido;
esta revisão dirigida não muda a tarefa inteira para concluida.
[Parecer e limites](../evidencias/revalidacao-CF-015-RV01/README.md).
