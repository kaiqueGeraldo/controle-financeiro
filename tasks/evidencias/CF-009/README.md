# Evidência CF-009

- Estado real e data: concluída em 09/09/2026; execução iniciada em
  08/09/2026.
- Modelo/esforço usados: executor desta conversa, esforço alto; a tarefa
  recomenda `gpt-5.6-sol`/`xhigh`.
- Commit/base e identificação do diff local testado: `main`, HEAD
  `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, mais o patch local não
  commitado de CF-001–CF-008. O estado inicial foi registrado; nenhum reset,
  checkout, stash ou descarte foi feito.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows/PowerShell;
  Node `24.18.0`; Next `16.1.6`; Vitest `4.1.11`; jsdom; Playwright `1.63.0`;
  Chromium nos viewports `360x800`, `768x1024` e `1440x900`; timezone local
  `America/Sao_Paulo`; testes unitários repetidos também em UTC e
  Pacific/Kiritimati; dados e resoluções de promises controlados, sem acesso a
  usuários reais.
- Dependências integradas: CF-003 e CF-008 constam como concluídas na mesma
  base local. A informação do solicitante de que todas as tarefas anteriores
  estavam concluídas foi compatível com os arquivos de estado encontrados.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| AC-UI-008, troca rápida | A/setembro é requisitado, depois B/outubro; B responde primeiro e A por último; seleção e fatura finais continuam B/outubro | `tests/component/async-state.test.tsx` | Aprovado mesmo quando o mock ignora `AbortSignal` |
| AC-UI-008, sessão | Fetch de A permanece pendente; logout limpa dados; login/fetch de B ocorre; resposta tardia de A não aparece na sessão B | `tests/component/async-state.test.tsx` | Aprovado com sentinela B `42.17` |
| AC-UI-009, erro e retry | Duplo clique no mesmo tick gera uma chamada; falha não chama sucesso, rejeita para o chamador e uma nova tentativa funciona | `tests/component/async-state.test.tsx` | Aprovado; as duas chamadas compartilham a mesma promise em voo |
| AC-UI-009, rollback | M1 falha depois de M2 válida; rollback de M1 não apaga M2 e somente M2 recebe sucesso | `tests/component/async-state.test.tsx` | Aprovado com chaves de entidade distintas e ordem controlada |
| Cancelamento | Cancelamento por navegação/troca de seleção não cria toast ou log de erro enganoso | `tests/component/async-state.test.tsx` | Aprovado com `AbortError` sintético |
| Refresh após erro | Falha real encerra loading; refresh seguinte pode publicar a nova fatura | `tests/component/async-state.test.tsx` | Aprovado com primeira promise rejeitada e retry controlado |
| AC-FIN-010, limite | Trava de UI não comprova idempotência ou serialização financeira no banco | leitura do ADR-004 e separação de escopo | Não reivindicado; permanece responsabilidade da CF-024 |

Os resultados esperados vieram de
`docs/sdd/specs/003-criterios-oracles.md` e do ADR-004. Não foram derivados do
comportamento observado na implementação anterior.

## Falha anterior

A árvore original não foi executada em vermelho antes da primeira edição. A
inspeção causal encontrou três mecanismos incompatíveis com os oráculos:

- `useCards` aceitava qualquer `refresh` que terminasse por último, sem versão
  de request;
- contexts mantinham resposta/cache sem vínculo com a identidade autenticada;
- `useOptimisticMutation` dependia de atualização assíncrona de `useState`
  para o lock e capturava o erro sem devolver a rejeição ao chamador.

Para não inventar uma regressão histórica, a capacidade dos testes foi
demonstrada depois por mutações controladas, uma de cada vez, sempre restauradas:

```text
1. Remover o retorno imediato da mesma promise por chave:
   async-state.test.tsx falhou no cenário de duplo clique; exit 1.

2. Remover request.isCurrent() do refresh de cartões:
   async-state.test.tsx recebeu invoice-a onde esperava invoice-b; exit 1.

3. Remover request.isCurrent() do FinanceProvider:
   async-state.test.tsx recebeu Conta/Categoria A onde esperava B; exit 1.
```

Essas execuções falharam nas assertions do comportamento sob teste, não por
importação ou ambiente. `rg` confirmou ao final que nenhum marcador das
mutações permaneceu. A ausência de uma execução vermelha da árvore original é
uma limitação explícita desta evidência.

## Correção e validação

- Foi criado um coordenador de requests por lane, escopo de usuário e revisão
  monotônica. A revisão decide correção; `AbortController` reduz trabalho, mas
  a resposta tardia continua segura mesmo se o cliente ignorar o sinal.
- Leituras autenticadas em hooks/contexts limpam estado na troca de usuário e
  só publicam dados quando a revisão e o escopo ainda são atuais. Caches de
  cartões incluem o usuário na chave.
- `useOptimisticMutation` agora mantém locks síncronos por chave em `ref`,
  compartilha a mesma promise para chamada duplicada, propaga o erro original,
  não emite sucesso em falha e silencia callbacks obsoletos após troca de
  usuário.
- Rollbacks que antes restauravam snapshots completos foram substituídos por
  reconciliação local à entidade em categorias, metas, hábitos, extrato e
  planejamento. Assim, uma falha antiga não desfaz uma mutação posterior não
  relacionada.
- Services de leitura aceitam `AbortSignal` opcional. Os contratos existentes
  de dados e erros foram preservados; nenhuma biblioteca de estado foi
  introduzida.

Comandos finais e códigos de saída:

```text
node scripts/test.mjs
15 execuções: 5 em America/Sao_Paulo, 5 em UTC e 5 em Pacific/Kiritimati; exit 0

node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
30 testes, 7 arquivos; exit 0

node node_modules/typescript/bin/tsc --noEmit
exit 0

node node_modules/eslint/bin/eslint.js <23 arquivos de produção/teste tocados>
exit 0, sem warnings

node node_modules/next/dist/bin/next build
14 páginas geradas; exit 0

node scripts/playwright.mjs test auth.smoke.spec.ts controlled-clock.spec.ts
6 testes nos 3 viewports; exit 0
```

O primeiro build Next falhou apenas porque o sandbox não conseguia baixar as
fontes Geist. A repetição com acesso à rede autorizado compilou, fez o
typecheck e gerou as 14 páginas. O wrapper global `npm` estava quebrado porque
seu `npm-cli.js` não existia; foram usados diretamente os CLIs já instalados em
`node_modules`, sem mudar dependências.

Uma execução adicional de `node scripts/playwright.mjs test` terminou com
`exit 1`: os 6 smokes passaram, mas os 3 casos de
`temporal.integrated.spec.ts` foram incluídos pelo config não integrado. Eles
pararam antes de validar o produto/backend porque o config fixa
`2026-09-08`, enquanto o spec integrado exige `2027-01-31`, e o sentinel do
backend integrado não estava disponível. Essa falha de seleção/relógio do
harness foi registrada como limitação, não convertida em regressão da CF-009 e
não foi contornada enfraquecendo o spec.

## Verificação adversarial

- As promises de A e B foram resolvidas manualmente na ordem inversa. O mock de
  cartões ignorou o abort deliberadamente para provar que cancelamento não é o
  único mecanismo de correção.
- O teste de logout/login resolveu B antes de A e verificou conta, categoria e
  valor sentinela; estado foi verificado também imediatamente após o logout.
- Um botão real no DOM recebeu dois cliques síncronos. Houve uma chamada de
  rede, um `onMutate`, zero sucesso na falha e uma rejeição observável por cada
  chamador; o clique de retry concluiu normalmente.
- M1 e M2 usaram chaves diferentes para permitir concorrência legítima. A
  falha tardia de M1 restaurou apenas a entidade A e manteve a alteração B.
- Cancelamento foi exercitado com `AbortError`; não houve toast de erro nem
  `console.error` falso.
- Após erro não cancelado, o loading da fatura encerrou e um refresh seguinte
  publicou a nova resposta, sem ficar preso na revisão anterior.
- Nenhuma assertion foi removida, nenhum teste recebeu skip/only e nenhum
  timeout foi ampliado. Em `temporal-navigation.test.tsx`, somente a fixture de
  autenticação foi tornada explícita porque as leituras agora exigem usuário;
  as assertions temporais existentes permaneceram.

## Revisão e pendências

- **Risco financeiro:** o lock tem custo médio O(1) por chave e evita chamadas
  duplicadas apenas dentro da instância React atual. Abas, processos, retries
  após resposta desconhecida e chaves semanticamente diferentes continuam
  podendo concorrer. A CF-024 deve validar idempotência/concorrência com
  PostgreSQL; bloquear botão não é garantia econômica.
- **Trade-off de requests:** iniciar/verificar uma lane é O(1); invalidar o
  escopo percorre as lanes ativas, O(l), normalmente poucas por provider. Cada
  provider ainda possui seu próprio coordenador, reduzindo acoplamento, mas
  repetindo uma pequena camada de infraestrutura em vez de adotar biblioteca
  global fora do escopo.
- **Trade-off de rollback:** atualizações imutáveis percorrem a coleção local,
  O(n), mas preservam mutações concorrentes. Snapshot integral seria simples,
  porém incorreto sob concorrência. Não houve mudança de query ou repositório,
  portanto esta tarefa não introduziu N+1.
- Não houve E2E integrado específico de logout A/login B ou dupla chamada
  financeira contra backend real. A validação da CF-009 é de componente com
  promises controladas; banco e fronteiras de autorização permanecem nas
  CF-023/CF-024.
- Não foram executados CI remoto, ambiente de produção ou revisão
  independente. A revisão de marco continua atribuída à CF-015.
- Nenhuma tarefa fica integralmente liberada apenas por esta conclusão. A
  CF-015 passa a ter CF-009 satisfeita, mas ainda aguarda CF-011–CF-014; a
  CF-026 continua aguardando CF-015. CF-010 e CF-016 já estavam executáveis por
  dependências anteriores.

Conclusão restrita à CF-009; não há promessa de ausência total de bugs.
