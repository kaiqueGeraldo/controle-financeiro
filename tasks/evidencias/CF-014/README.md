# Evidência CF-014

- Estado real e data: concluída em 13/09/2026.
- Modelo/esforço usados: GPT-5 / high.
- Commit/base e identificação do diff local testado: `1ced2f027fa46ab265b211829375581880cbb07b`, com patch local preexistente das CF-010–013 preservado. Este lote altera somente as telas de metas, investimentos e resumo anual, o hook de resumo anual, dois componentes de resumo e seus testes.
- Runtime, sistema, navegador, viewport, timezone e seed: Node local, Windows, jsdom (camada de componente), `America/Sao_Paulo`, `cf001-v1`, relógio `2026-09-08T02:59:59.000Z`. Não houve navegador real.
- Dependências integradas: CF-005 e CF-010 concluídas; a execução tomou CF-008 como integrada conforme informado pelo operador e pelos patches locais. CF-008 permanece formalmente `em_revisao` por pendências de revisão que não impedem esta alteração visual de leitura.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| AC-UI-002 | Um `503` é recuperável e não pode parecer coleção vazia, saldo zero ou ano sem dados. | `goals-investments-habits-annual-audit.test.tsx` | Metas, investimentos e resumo exibem erro e acionam a releitura. |
| AC-UI-012 / AC-FIN-004 | A posição atual não é fechamento de 2025; sem histórico, mostrar indisponibilidade, não zero nem valor atual. | `goals-investments-habits-annual-audit.test.tsx` | 2025 oculta `1300,00` e explica a indisponibilidade; ano atual rotula a posição atual. |
| AC-TIME-001 | Data civil conhecida `2026-09-07` aparece como `07/09/2026`. | `goals-investments-habits-annual-audit.test.tsx` | Histórico de investimento preserva o dia quando `dateOrigin` é conhecido. |
| AC-TIME-004 | Meta concluída não atrasa na virada do dia. | suíte de componentes, caso preexistente `temporal-presentation.test.tsx` | Aprovado no conjunto final. |
| AC-TIME-010 | Hábito semanal conta somente logs da semana do dia do produto; alternância recebe esse dia. | `goals-investments-habits-annual-audit.test.tsx` | `2/3` e toggle de `2026-09-08` aprovados. |
| Nota anual | Só concluir edição após confirmação; conteúdo confirmado reaparece após desmontar e reler. | `annual-summary-note-reload.test.tsx` | Falha preserva editor; confirmação HTTP simulada reaparece em nova montagem. |

## Falha anterior

1. Metas e investimentos descartavam `error` já produzido pelos providers e renderizavam a coleção vazia. O resumo anual registrava erro apenas no console e mostrava “Nenhum dado encontrado”.
2. `AnnualSummaryService` busca metas e investimentos atuais independentemente do ano; a tela os apresentava dentro do resumo de qualquer ano. Para 2025, isso podia rotular uma posição atual como histórica.
3. Ao falhar a gravação da nota, o bloco saía da edição mesmo sem confirmação.

## Correção e validação

- Adicionado estado recuperável de erro às telas de metas, investimentos e resumo anual. O hook anual limpa conteúdo anterior antes de uma leitura não cacheada, expondo erro sem deixar dados de outro ano visíveis.
- Para ano passado, a seção de metas/investimentos declara indisponibilidade. Para o ano atual, a interface declara explicitamente “posição atual”, sem alegar fechamento anual. A reconstrução histórica permanece para CF-021.
- `saveNote` retorna confirmação booleana; o editor só fecha após sucesso.
- Comandos aprovados (código 0):
  - `node .\\node_modules\\vitest\\vitest.mjs run --config tests\\component\\vitest.config.mts tests\\component\\goals-investments-habits-annual-audit.test.tsx` — 7/7.
  - `node .\\node_modules\\vitest\\vitest.mjs run --config tests\\component\\vitest.config.mts tests\\component\\annual-summary-note-reload.test.tsx` — 1/1.
  - `node .\\node_modules\\vitest\\vitest.mjs run --config tests\\component\\vitest.config.mts` — 20 arquivos, 109/109.
  - `node .\\node_modules\\typescript\\bin\\tsc --noEmit` — aprovado.
  - ESLint focado nos arquivos modificados — aprovado.
  - `git diff --check` — aprovado.

## Verificação adversarial

- Mutação temporária removendo o ramo `error` de metas: a regressão falhou porque a tela passou a expor “Nenhuma meta criada ainda” em vez do heading de erro. Restauração confirmada antes das validações finais.
- Mutação temporária que exibia a posição atual em todo ano: o caso AC-UI-012 falhou pela ausência do heading de indisponibilidade em 2025. Restauração confirmada antes das validações finais.
- A fixture de histórico sem `dateOrigin` foi deliberadamente rejeitada como data conhecida: pelo contrato temporal, a apresentação neutra é correta sem proveniência. A fixture final informa `USER_INPUT` e verifica o dia civil literal.

## Revisão e pendências

- Limitação de build: `next build` falhou somente ao buscar `Geist` e `Geist Mono` em `fonts.googleapis.com`; a compilação chegou ao estágio de build e não acusou erro do lote. Não foi alterada configuração de fontes para esconder a falha de rede.
- Não foram executados Playwright, BFF real, backend, PostgreSQL, capturas visuais ou zoom nativo. Os testes de componente verificam conteúdo, teclado e estados sintéticos; a inspeção visual independente continua em CF-015.
- CF-021 continua dona da reconstrução/contrato de posição histórica; CF-020 continua dona de cálculo de ativos e alocações; CF-022 continua dona de janela, cron e idempotência de hábitos.
- A conclusão é limitada a esta auditoria de apresentação e estados de leitura; não certifica cálculo financeiro nem ausência total de defeitos.
