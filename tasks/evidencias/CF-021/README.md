# Evidência CF-021 — conciliação de relatórios

- Estado real e data: implementação local em `em_revisao`, 28/09/2026; revisão independente pendente.
- Modelo/esforço usados: Codex GPT-6; a recomendação da tarefa (`gpt-5.6-sol / high`) é metadado, não configuração automática desta sessão.
- Base: `bfa08556eb4cd3e436294c8a59d19bc7cc4269b7` (`main`). O `README.md` já estava modificado e foi preservado fora dos commits; SHA-256 antes/depois: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
- Runtime: Windows, Java Temurin 21.0.12.1, Spring Boot 4.0.2, PostgreSQL 16 descartável via Testcontainers/Docker Desktop, Node 24.18.0, Vitest/jsdom, relógio fixo em `America/Sao_Paulo` nos cenários CF-021. Nenhum navegador ou viewport real foi usado.
- Dependências integradas na base local: CF-018, CF-019 e CF-020, todas ainda `em_revisao`. Regras: [CF-016](../../03-integridade/CF-016-regras-financeiras.md), SPEC-004/DEC-04 e [oráculos](../CF-016/ORACLES.md).
- Diff testado: código e testes da CF-021 em `4d2095aae377a0f8188b4ff3630691962d0ee0cf` em relação à base acima, sem o `README.md` preexistente. Este arquivo e o estado da tarefa formam o commit de evidência posterior.

## Critérios e resultado esperado independente

| Critério | Oráculo sintético calculado pela regra | Teste/camada | Resultado |
|---|---|---|---|
| Abertura, pendência e principal fora do desempenho | Abertura 1.000, receita realizada 100, receita pendente 250, consumo bancário 40, compra de ativo 200 e pagamento de fatura 20: desempenho do mês **100 − 40 = 60**; caixa no intervalo **100 − 40 − 200 − 20 = −160**. Despesa de 9 no ano anterior entra apenas no XLSX sem filtro: 49. | `periodResultExcludesOpeningPendingTransferAndInvestmentPrincipal`, PostgreSQL | Passou |
| Total global não depende da página | 501 entradas de 0,01: total 5,01, ainda que a lista esteja nas páginas 0/1 com tamanho 30; XLSX atravessa o limite interno de 500 e contém a linha 501 com data civil 07/09/2026. | `exportTraversesSecondDatabasePageWithoutChangingGlobalTotal`; `temporal-navigation.test.tsx`, componente | Passou |
| Cartão sem dupla contagem | Compra 120 em 07/09 e estorno 20 em 08/09: consumo líquido 100. Somado a 40 bancários, despesa gerencial 140; pagamento de fatura 20 não soma de novo. Filtro de conta retorna apenas 40. XLSX mantém datas, valores e aba de cartão. | `cardConsumptionAndRefundAppearOnceInDashboardAnnualAndPeriodExport`, PostgreSQL | Passou |
| Transferência e reversão | Transferência interna 200: consolidado zero; conta origem −200, destino +200; taxa 2 gera −2 consolidado. Reversões de outubro têm sinais contrários sem criar desempenho. | `internalTransferAppearsByAccountAndCancelsInConsolidatedCash`, PostgreSQL | Passou |
| Estorno de principal preserva classificação | Compra de ativo de 200 seguida de estorno de 200: caixa tem entrada 200, saída 200 e líquido zero; consumo zero; as duas linhas do XLSX não ganham coluna de despesa gerencial. Estorno da perna de saída de transferência aparece como entrada positiva no resumo da conta. | `reversingInvestmentPrincipalDoesNotCreateNegativeConsumption` e teste de transferência, PostgreSQL | Passou |
| Venda de ativo separa principal e ganho | Venda bruta 100, taxa 1, custo baixado 80,80: caixa recebe 99, receita ordinária 0, ganho realizado **18,20** em linha própria; resultado gerencial 18,20. Custo ausente torna resultado indisponível (`null`). | `investmentPrincipalIsExcludedButRealizedGainIsItsOwnLine`, PostgreSQL | Passou |
| Posição histórica não inventada | Ativo de custo 400 e avaliação 500: ano de 2025 retorna posição `null`; 2026 informa custo 400 e valor atual 500 datado. Segundo ativo sem avaliação eleva custo a 450, mas valor agregado fica `null`, sem tratar a falta como zero. | `historicYearNeverReceivesCurrentValuationAndCostIsNotAddedToValue`, PostgreSQL; `cf021-reporting.test.tsx`, componente | Passou |
| Contrato HTTP e binário | `GET /transactions/summary` autenticado devolve 12,34 mesmo com `page=99`; XLSX do período informa 12,34; exportação com apenas mês retorna 400. | `authenticatedSummaryAndExportExposeSamePeriodAndRejectIncompletePeriod`, MockMvc + PostgreSQL | Passou |
| Estados visuais | Extrato mostra resumo global e mantém paginação; dashboard nomeia fluxo de caixa acumulado; resumo anual não exibe posição atual como fechamento de ano passado nem transforma `null` em zero. | `cf021-reporting.test.tsx`, `temporal-navigation.test.tsx`, componentes com HTTP simulado | Passou |

As quantias acima foram definidas antes de comparar o código e não são calculadas pelo método de produção no `expected`.

## Falha anterior

O primeiro teste de integração com PostgreSQL reproduziu dois defeitos da base: despesa mensal esperada **40** veio **240** porque a compra de ativo de 200 era somada como consumo; posição de 2025 esperada `null` veio **500**, a avaliação corrente. A infraestrutura de teste inicialmente falhou por caminho antigo do JDK e acesso sandbox ao repositório Maven; essas tentativas **não** contam como regressão financeira. Após acrescentar o caso de ganho de venda, houve uma falha intermediária no teste ao alterar apenas a entidade gerenciada sem persistir/flush antes da consulta agregada; o teste passou a gravar explicitamente o custo desconhecido com `saveAndFlush`, sem alterar o oráculo `null`.

## Correção e validação

- Backend: agregados SQL por período/filtro para desempenho e caixa; compras e estornos de cartão por data civil; ganho realizado de investimento separado do principal; classificação de estorno herdada do lançamento original; posição atual com custo/avaliação/cobertura; exportação paginada em lotes de 500 com efeitos no resultado e aba de cartão.
- Frontend: extrato lê agregado global da API; dashboard diferencia resultado e fluxo de caixa acumulado; resumo anual e telas de investimentos/contas exibem subtotais conhecidos e indisponibilidade explícita.
- `mvnw.cmd --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository -Dtest=Cf021ReportingIntegrationTest test`, com `JAVA_HOME` apontando para `target/temurin21`: **8/8**, saída 0. O teste roda serviço/ORM e, no caso HTTP, controller/serialização/autenticação com PostgreSQL real descartável.
- `mvnw.cmd --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository test`: suíte completa **170/170**, saída 0 na validação final.
- `node_modules/.bin/vitest.cmd run --config tests/component/vitest.config.mts --reporter=dot`: **144/144**, 31 arquivos, saída 0.
- `node_modules/.bin/tsc.cmd --noEmit`: saída 0.
- `git diff --check` e inspeção do diff/staging: saída 0. Não houve migração, banco persistente/produção, deploy, E2E navegador ou captura visual nesta execução.

## Verificação adversarial e trade-offs

- O dataset inclui zero, ano anterior, transferência, reversão, compra não paga, origem de abertura, compra/venda de ativo, estorno de cartão, filtro de conta e duas páginas de exportação. Nenhuma assertion foi reduzida; a assertion antiga de título mudou de “posição atual de metas e investimentos” para “posição atual de investimentos” porque meta monetária é destinação, não ativo adicional; a assertion de valor permaneceu.
- Agregados SQL evitam carregar todas as transações para calcular cabeçalhos e evitam N+1 por item. O custo é proporcional às linhas do filtro no banco; o gráfico monta pontos em `O(P + N_agrupados)`. O XLSX pagina as entidades (`500` por leitura, `100` linhas retidas pelo SXSSF), mas o `byte[]` final e o download ainda usam memória `O(tamanho do arquivo)`; medir limites e índices pertence à CF-025.
- A posição corrente foi retirada do cache anual para impedir avaliação obsoleta. Isso aumenta leituras agregadas por request; política de invalidação/concorrência é tema da CF-024. A posição histórica permanece indisponível sem snapshots comprovados. O gráfico mostra **variação acumulada do caixa no intervalo**, não saldo ou patrimônio de fechamento, pois abertura e passivos não fornecem série histórica confiável.

## Revisão e pendências

- Revisão independente pendente, responsável a designar conforme [EXECUCAO](../../EXECUCAO.md). `em_revisao` não significa publicação aprovada.
- Linhas legadas com origem operacional desconhecida ainda requerem reconciliação; não foram reclassificadas por descrição ou horário. Venda sem custo conhecido devolve resultado `null`. Uma compra de cartão legada sem proveniência de `PURCHASE` não entra no consumo calculado.
- Valores são exatos com `BigDecimal` no backend até a serialização, mas XLSX e UI usam `double`/`number`; verificar apresentação de valores extremos e desempenho com grande volume em CF-025. Não há prova de UI em 360/768/1440, claro/escuro, nem fluxo navegador → Next → Spring → banco; CF-032 continua como validação E2E do conjunto.
- CF-025 e CF-032 ganham a contribuição de CF-021 como dependência local, mas **nenhuma fica integralmente liberada**: CF-025 ainda depende de CF-022/024; CF-032 de CF-022/023/024/026/031, além dos gates de revisão das dependências.
