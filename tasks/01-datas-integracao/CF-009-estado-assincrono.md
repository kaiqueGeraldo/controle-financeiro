# CF-009 — Corrigir corridas de requisição e mutações otimistas

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-003](../00-fundacao/CF-003-harness-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md)
- Origem: T-003, T-009; F-007

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
- [ ] Erro não dispara callback/toast de sucesso; nova tentativa funciona; cancelamento não gera erro enganoso. Reaberto por RV01/R03 na revalidação CF-015.
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
