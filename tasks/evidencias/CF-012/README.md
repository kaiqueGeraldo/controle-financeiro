# Evidência CF-012

- Estado real e data: implementação concluída, tarefa `em_revisao` em 13/09/2026; falta roteiro visual autenticado e a revisão independente posterior em CF-015.
- Modelo/esforço usados: GPT-5 / high.
- Commit/base e identificação do diff local testado: `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`; patch local preexistente foi preservado e o diff desta tarefa adiciona estado de erro/retry aos consumidores de leitura financeira, componentes e testes.
- Runtime, sistema, navegador, viewport, timezone e seed: Node 24.18.0, Windows, jsdom, `America/Sao_Paulo`, seed `cf001-v1`, relógio `2026-09-08T02:59:59.000Z`. Não houve navegador autenticado com backend descartável.
- Dependências integradas: o solicitante confirmou CF-005, CF-008 e CF-010 finalizadas; CF-010 consta concluída no estado local.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Erro não é vazio nem saldo zero | Falha de API não é uma resposta financeira válida; a tela deve esconder totais/listas e oferecer nova leitura | `dashboard-accounts-extract.test.tsx` com 503 sintético; `async-state.test.tsx` com rejeição e retry real do provider/hook | Aprovado: contas, extrato e dashboard mostram erro nomeado, não `Patrimônio Total`/`Saldo do Período`, e acionam retry. |
| Retry recupera estado | Uma segunda resposta válida deve limpar erro e usar somente os dados retornados | `async-state.test.tsx` | Aprovado: contas recuperam saldo sintético de R$ 42,00; extrato repete página 0 e limpa o erro. |
| Datas civis de lista não deslocam | `YYYY-MM-DD` é data civil, não instante local | `temporal-navigation.test.tsx`; consumidores agora usam `formatCalendarDate` | Aprovado: grupos do extrato e recentes do dashboard não fazem `new Date(...T12:00)` para apresentar dia civil. |
| Total não muda de significado com paginação | “Saldo do Período” deve ser agregado do período/filtro completo, não da página | Auditoria de `useExtract` | Achado **F-018** aberto para CF-021: contrato atual não entrega agregado completo. Não houve compensação no componente. |

## Falha anterior

Antes do patch, `FinanceProvider`, `DashboardProvider`, `useCards`, `GoalsProvider`, `InvestmentsProvider` e `useExtract` capturavam falhas de leitura e seguiam com arrays/objetos iniciais. Assim, contas/extrato podiam renderizar R$ 0,00 ou lista vazia como estado legítimo.

Regressão causal: uma mutação temporária em `DataLoadError` trocou a mensagem especificada por `Dados indisponíveis.`. `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/dashboard-accounts-extract.test.tsx` falhou em 3/3 cenários porque não encontrou o heading esperado. A mutação foi restaurada, sem descartar mudanças locais.

## Correção e validação

- Criado `DataLoadError`, com mensagem explícita, botão nomeado e estado desabilitado durante retry.
- Providers/hooks agora preservam `Error | null`; abortos continuam neutros. Dashboard aguarda fontes de leitura antes de mostrar cartões e reúne erros de contas, cartões, metas, investimentos, fluxo e recentes.
- Extrato limpa a cache e recarrega página 0 no retry; não soma páginas para inventar um saldo completo.
- Foram ajustados dois consumers de data civil e removidos `any`/import não usado nos arquivos tocados.

Comandos executados (todos saída 0, salvo onde indicado):

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/async-state.test.tsx tests/component/dashboard-accounts-extract.test.tsx
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/eslint/bin/eslint.js <arquivos alterados de produção>
git diff --check
```

Resultados: regressão direcionada 14/14; suíte de componentes 95/95 em 18 arquivos; typecheck, lint direcionado e `diff --check` aprovados. O `npm` global do host falha ao localizar `npm-cli.js`; foram usados binários locais equivalentes, como nas evidências anteriores.

`node node_modules/next/dist/bin/next build` foi tentado e falhou exclusivamente ao baixar Geist/Geist Mono de `fonts.googleapis.com`; o aviso preexistente de `middleware` também apareceu. Não foram modificadas fontes, layout raiz ou configuração de build para mascarar a indisponibilidade de rede.

## Verificação adversarial

- Rejeição 503 sintética para contas e extrato: erro explícito, sem total/lista enganosa; retry validado com resposta posterior válida.
- Mutação temporária de texto do estado de erro: 3/3 cenários de telas falharam; restauração seguida de regressão direcionada verde.
- Paginação: o achado F-018 impede que o frontend apresente como total um cálculo de página. A correção requer contrato agregado e pertence a CF-021, não a um recálculo local O(n) sobre páginas parciais.

## Revisão e pendências

- Não foi possível executar roteiro funcional autenticado em Chromium nas três viewports nem persistência após reload: não há backend/PostgreSQL descartável autenticado disponível nesta execução. Isso não foi apresentado como E2E aprovado.
- O build exige acesso ao Google Fonts; repetir com rede autorizada/artefatos disponíveis antes de gate de release.
- F-018 aguarda CF-021; não deve ser “resolvido” somando apenas páginas já carregadas, pois seria parcial e com custo de rede/memória crescente.
- Revisão independente de escopo e diffs: CF-015. Não há garantia de ausência de defeitos fora do escopo.
