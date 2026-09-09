# CF-005 — Completar regressões e correções temporais do frontend

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-003](../00-fundacao/CF-003-harness-frontend.md), [CF-004](../01-datas-integracao/CF-004-contrato-temporal.md)
- Origem: T-002; F-001–004

## Problema e resultado esperado

O patch inicial passou em testes de helper. Ainda falta provar que formulários, labels, prazo e navegação usam corretamente esse contrato, sem reintroduzir conversões locais/UTC.

## Escopo e referências

- `controle-financeiro-frontend/src/utils/date.ts`
- `controle-financeiro-frontend/src/utils/format.ts`
- `controle-financeiro-frontend/src/components/forms/`
- `controle-financeiro-frontend/src/components/screens/`
- `controle-financeiro-frontend/src/hooks/`
- `controle-financeiro-frontend/src/contexts/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Preservar e auditar o patch existente; localizar todos os consumidores temporais, inclusive os que ainda concatenam horário artificial.
2. Testar componentes com relógio controlado: submissão do formulário, formato de label, status de prazo e troca de mês.
3. Demonstrar falha sobre lógica anterior/mutação isolada antes de confirmar a regressão; ajustar consumidores restantes conforme CF-004.

## Aceite e testes adversariais

- [x] Data digitada e payload coincidem; hoje não vira amanhã às 23h30; label não mostra dia anterior.
- [x] Meta hoje não atrasa, concluída não atrasa; janeiro/31 navega para fevereiro; repetir navegação não muda mês indevidamente.
- [x] Mutações toISOString para hoje e Date civil formatada no fuso local são detectadas; evidenciar componentes, não só helpers.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Alterar data histórica no banco, reescrever cálculos financeiros ou mudar aparência sem defeito temporal.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada e concluída em 08/09/2026 sobre `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, preservando o patch local das CF-001–004. A entrega cobre consumidores reais: os quatro formulários usam data local e os três com horário capturam um único instante na abertura; labels civis não deslocam nem normalizam datas inválidas; metas reavaliam atraso na meia-noite e em foco/visibilidade por um provider global; cartões, extrato e planejamento navegam por competência ancorada no dia 1; o extrato ordena datas civis sem convertê-las em instantes.

Validação final: 15/15 execuções unitárias em São Paulo, UTC e UTC+14, 11/11 testes de componente em São Paulo, typecheck, lint direcionado e build Next de produção aprovados. As mutações `toISOString`, parsing local com `new Date(value)` e `setMonth` falharam respectivamente em 2, 2 e 3 testes de consumidor e foram restauradas. [Evidência completa, comandos, falhas anteriores, auditoria e riscos](../evidencias/CF-005/README.md).

Limites: o `npm` global do host está quebrado, então foram usados binários locais equivalentes; o build precisou de rede para Google Fonts e mantém o aviso preexistente de `middleware`; lint global legado permanece CF-026. Não foram executados navegador real, BFF, backend, PostgreSQL ou revisão independente. Timestamps legados aguardam CF-008/017; calendário semanal de hábitos, CF-022; cálculo bancário de vencimento/fechamento, CF-019.

Dependências: a parcela frontend da CF-007 está satisfeita, mas ela ainda aguarda CF-006. CF-012, CF-013 e CF-014 têm CF-005 satisfeita, mas ainda aguardam CF-008 e CF-010. Nenhuma tarefa ficou integralmente liberada apenas por esta conclusão; CF-006, CF-008 e CF-010 já estavam liberadas pelas dependências anteriores. Nenhuma tarefa seguinte foi iniciada ou teve o estado alterado.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Revisão independente — 09/09/2026

R08/R11/R13 corrigidos. P05 permanece vermelho: hábitos usam dia do navegador onde SPEC-002 exige diaProduto.

O [parecer da revisão](../evidencias/revisao-CF-001-CF-009/README.md) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

- [ ] Fechar as pendências atribuídas a esta tarefa no parecer independente.
