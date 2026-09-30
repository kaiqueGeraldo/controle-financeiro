# RVA-01 e RVA-02 — correção financeira dirigida

Critérios: [achados independentes](../revalidacao-CF-016-CF-021/ACHADOS.md), FIN-04/FIN-07 da SPEC-004 e decisão NG-01 já fechada. As duas assertions de IndependentRemediationBoundaryTest foram mantidas integralmente.

## RVA-01

Antes: quantidade inicial 3, custo 3, total 1. Venda de uma unidade deixa 2 e 0,67; provento de 1 e cancelamento não mudam quantidade/custo. A compensação, contudo, chamava evaluateTotal(0,67), reancorando a referência em 0,67/2. A venda seguinte calculava 0,335 e apresentava 0,34, contrariando a referência original 1/3.

Correção: o replay muda quantidade/custo e resizeValuation aplica a declaração existente. Não chama evaluateTotal, não converte PRICE em TOTAL e não deriva uma declaração do beforeValue arredondado da operação. Referência, modalidade, preço, data e origem permanecem independentes do replay. Não cria auditoria de avaliação fictícia. O mesmo valueForQuantity calcula elegibilidade da reserva e posição final, sob os locks existentes de conta→investimento.

Oráculos independentes: terços de 1 deixam 0,67/0,33/0; 200 milhões com total 1 deixam 0,50 após metade e 0 no final. PRICE 0,33333333 × 2 = 0,66666666 → 0,67; × 1 → 0,33, sem transformar o preço em total. Provento bruto 1/taxa 0,10 devolvida resulta em compensação de caixa -0,90, quantidade/custo inalterados e retry sem nova correção. Substituir compra de 3 unidades por 2 na posição inicial de 3, depois de vender 2, deixa 3 unidades e avaliação 1,00 pela declaração original; nova venda de 2 deixa 0,33.

## RVA-02

Antes: custo inicial desconhecido permanece null também no remanescente após vender todas as unidades. Correção: setQuantityAndCost zera somente o custo remanescente quando a quantidade final é zero. costDelta e realizedResult são calculados antes dessa mudança e continuam null se o custo de aquisição era desconhecido. ReplayCost e metadados históricos não são preenchidos. Posição aberta continua com custo desconhecido.

Para posições já encerradas armazenadas com custo bruto null, getTotalCost apresenta zero somente com quantidade zero. JPA continua usando os campos; uma leitura não faz backfill do valor bruto. O DTO de posição e o resumo anual passam a representar a exposição atual conhecida, sem certificar cobertura histórica. Avaliação inicial ausente não é indiscriminadamente convertida em zero; o encerramento usa resizeValuation, como antes. Nenhuma migração necessária ou editada.

Oráculos: vendas de 4 e 6 das 10 unidades, preço 25/taxa 1 em cada, creditam 99 + 149 e deixam banco 1248. Após a primeira venda, custo/avaliação permanecem desconhecidos; após a última, quantidade/custo/avaliação remanescentes são zero, custos baixados/ganhos históricos continuam null. Resgate monetário final de 250/taxa 1 com custo desconhecido também zera apenas o remanescente. Relatório completo de ganho permanece indisponível.

## Antes/depois e alcance

- rva01-rva02-antes.log: 2 testes, 2 falhas de assertion, zero erros de infraestrutura.
- backend-afetado.log: primeiro diff, 60 passes.
- backend-afetado-final.log: diff final, 62 passes, zero falhas/erros/skips; inclui as duas provas originais e oito novos casos de regressão com Flyway V1–V11/Hibernate validate/commits reais. Os 60 estão contidos nos 62; não somar.
- Suíte dirigida: IndependentRemediationBoundaryTest, ResidualInvestmentRegressionTest, MilestoneValuationTest, MilestoneInvestmentCorrectionTest, Cf020InvestmentGoalIntegrationTest, MilestoneReportingPositionTest, MilestoneReportingCoverageTest, MilestoneCashPresentationTest e IntegratedMilestoneReviewTest.

Não altera resultado esperado, fatos originais, V1–V11 ou decisão NG-01. Mantém critérios antigos, inclusive abertura sem avaliação conhecida. Não certifica todos os históricos legados ou correção de operações cuja cadeia inicial é desconhecida: a necessidade de reconciliação explícita da cadeia permanece.

Complexidade inalterada: leitura do remanescente O(1); replay O(n) por compensação com revisões auditáveis, potencial O(n²) acumulado em histórico crescente. Sem queries adicionais/N+1, novo lock global, novo schema ou benchmark amplo. A referência autoritativa conserva estabilidade de arredondamento ao custo de poder representar quantidades posteriores à declaração; uma avaliação diferente exige comando explícito e auditoria.
