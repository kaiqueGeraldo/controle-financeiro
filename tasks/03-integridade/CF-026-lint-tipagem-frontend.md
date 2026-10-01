# CF-026 — Eliminar dívida de lint e tipagem sem esconder defeitos

- Estado: bloqueada
- Prioridade: P2
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-009](../01-datas-integracao/CF-009-estado-assincrono.md), [CF-015](../02-frontend/CF-015-revisao-marco-frontend.md)
- Origem: T-011; F-017

## Problema e resultado esperado

Baseline de 70 erros e 37 avisos precisa ser reavaliado após correções. Tipagem e hooks devem revelar contratos, não silenciar o compilador.

## Escopo e referências

- `docs/sdd/lint-baseline.md`
- `controle-financeiro-frontend/src/`
- `controle-financeiro-frontend/eslint.config.mjs`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Reexecutar baseline e corrigir por regra/arquivo em lotes: DTOs desconhecidos, hooks, componentes estáticos, entidades JSX e variáveis.
2. Substituir any por contratos/unknown com narrowing, sem casts cegos; preservar efeitos e dependências funcionais.
3. Rodar testes dos consumidores a cada lote e atualizar baseline/resultados; escalar para Sol quando o problema for arquitetura de estado.

## Aceite e testes adversariais

- [ ] Lint final sem erros e avisos não justificados; nenhum disable global/ts-ignore/any artificial para passar.
- [ ] Remover variável não remove efeito colateral necessário; alteração de hook tem regressão de atualização/cleanup.
- [ ] Typecheck/build e fluxos tocados continuam aprovados; baseline não é reduzido apenas excluindo arquivos.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Reescrever todas as telas ou enfraquecer regras sem justificativa do contrato.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação executada em 01/10/2026 na base `04cad8d072f789fbe3f4050d8912d5526ec600f5`.
Implementação bloqueada: CF-009 e CF-015 permanecem `em_revisao` nos
arquivos canônicos integrados. CF-015 registra zoom nativo 200% sem evidência
nem aprovação; o encerramento dirigido de RV01 não concluiu o marco.
A instrução desta execução exige respeitar as dependências, sem antecipar
correções nem executar outra tarefa para encerrá-las.

Diagnóstico sem alterações de código: lint com 23 erros e 21 avisos em 234
arquivos; typecheck aprovado. A baseline histórica de 70/37 foi preservada
e a medição atual adicionada ao documento de referência. Nenhuma regra,
exclusão, contrato ou teste foi alterado. Build, testes dos consumidores,
regressões e revisão das correções não executados, pois não houve implementação.

[Evidências, comandos, preservação e limitações](../evidencias/CF-026/README.md).
Retomar após conclusão e integração de CF-009 e CF-015, com nova medição da
base então usada. Nenhum critério de aceite foi marcado como cumprido e
nenhuma tarefa ficou liberada; CF-032 e CF-034 mantêm CF-026 pendente.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.
