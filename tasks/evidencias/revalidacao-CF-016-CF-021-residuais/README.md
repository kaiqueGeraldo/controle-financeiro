# Revalidação dirigida dos resíduos RVA-01–03 — 30/09/2026

Intervalo conferido: `e927aea03801562dba1cacbc196aaee6721b155c..0099185c22b743de3dd66e30e326c8378770b101`. HEAD inicial igual ao candidato; ancestralidade válida; staging vazio; única alteração alheia inicial: README raiz, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. Base em [base-status.txt](base-status.txt). Produto e migrações do checkout compartilhado não foram alterados nesta revisão.

**RVA-01 e RVA-02 aprovados e encerrados no escopo das correções financeiras. RVA-03 continua inconclusivo quanto à causa.** A aprovação dessas correções recupera os critérios de NG-01/RVI-07/RVI-21 diretamente afetados, conservando os encerramentos anteriores. Ela não equivale a aceite integrado irrestrito do marco ou autorização de publicação.

## Parecer separado e provas independentes

| Resíduo | Critério original e confronto do diff | Revalidação independente | Parecer |
|---|---|---|---|
| RVA-01 / P1 | Provento compensado entre vendas de quantidade3/total1 não pode trocar1/3 por0,67/2. `InvestmentCorrectionService` remove a reavaliação e o fallback baseado em beforeValue arredondado; `resizeValuation` conserva declaração e metadados. | Duas assertions originais intactas; ResidualInvestmentRegressionTest verifica DIVIDEND/INTEREST, TOTAL/PRICE, referência/data/origem, original imutável, retry único, ausência de avaliação fictícia, substituição com venda dependente, fechamento e reabertura. Sequência0,67→0,33→0 e extremo200 milhões1→0,50→0. SAN-RVA confirma UI/BFF/PG/reload. | **Encerrado no escopo comprovado.** NG-01 permanece decidido, sem novo aceite de histórico desconhecido ou mudança de modalidade implícita. |
| RVA-02 / P2 | Quantidade final zero exige custo residual zero, preservando custo baixado/resultado/proveniência desconhecidos. `setQuantityAndCost` zera apenas remanescente vazio; getter normaliza legado vazio na leitura, mantendo null bruto armazenado. | Vendas parcial/final com taxa: custo atual parcial null e final0; cost_delta/realized_result/replay_cost continuam null. Resgate monetário final, legacy raw null antes/depois da leitura, API de posição, anual/dashboard e ganho incompleto. SAN-RVA: banco1253, posição0/0/0, histórico null e metadados ausentes. | **Encerrado no escopo comprovado.** Não há conversão geral de null em zero: quantidade positiva continua desconhecida; zero residual não certifica ganho histórico. |
| RVA-03 / P2 | Primeiro pagamento120 teve POST200, débito120, pagável0 e modal/spinner sem ação de recuperação em15s. Dois diagnósticos anteriores passaram sem reproduzir causa. | Evidência original reexaminada; candidato sem instrumentação passou R03 nos quatro modos e SAN-RVA. Novo experimento limitado e resultados em [EXPERIMENTO-RVA-03](EXPERIMENTO-RVA-03.md). | **Pendente/inconclusivo quanto à causa.** Repetição verde não fecha o resíduo. Não se atribui a lock, cancelamento, animação ou harness sem evidência causal. |

As provas originais foram confrontadas com `ACHADOS.md`, logs vermelhos e contrato FIN-04/FIN-07/NG-01; o diff não altera expected, não adiciona skips e não relaxa tolerâncias. O resultado original0,34 e o custo null ficaram preservados na revisão anterior e no saneamento. Reproduzi o candidato com os mesmos expected0,33 e0,00.

## Execuções desta revisão

| Execução | Resultado | Evidência |
|---|---|---|
| Backend dirigido ao diff e consumidores | 62/62; zero falhas/erros/skips | logs/backend-dirigido.log |
| Browser do candidato sem instrumentação | 5/5 + pós-condições Java/SQL; R03 quatro modos e SAN-RVA | logs/browser-candidato.log; browser/candidato |
| Experimento RVA-03 na cópia instrumentada | 10/17 aprovados; 7 falhas preservadas antes de abrir pagamento por interceptação do portal; Maven exit1 | logs/experimento-curto.log; browser/experimento-curto |
| ESLint do hook de revisão | Zero erros/warnings | logs/lint-instrumentacao.log |
| Sintaxe do preparador Node | Aprovada | `node --check prepare-experiment.mjs` |

Comando backend: `-Dtest=IndependentRemediationBoundaryTest,ResidualInvestmentRegressionTest,MilestoneValuationTest,MilestoneInvestmentCorrectionTest,Cf020InvestmentGoalIntegrationTest,MilestoneReportingPositionTest,MilestoneReportingCoverageTest,MilestoneCashPresentationTest,IntegratedMilestoneReviewTest`, JVM UTC, JDK21, Maven wrapper/repositório local conforme saneamento. Browser: `-Dtest=MilestoneRemediationBrowserTest`, `-Dreview.grep=R03: pagamento|SAN-RVA`, `-Dreview.evidence=../../revalidacao-CF-016-CF-021-residuais/browser/candidato`. PostgreSQL16 descartável; caminhos financeiros críticos usam Flyway V1–V11/Hibernate validate. Setup de abertura/provento/vendas é HTTP explícito; a compensação é acionada pela UI, seguida de API/reload/SQL. E-mail/cotação são doubles externos.

Os62 incluem as duas provas originais e os oito casos residuais. Java orquestrador não é jornada adicional. Não repetir/somar os60/62 do executor como novos testes; esta é uma execução independente62. Não foram refeitos234,18 temporais, H01/H02 ou auditoria visual integral; os respectivos encerramentos anteriores permanecem e não são apresentados como novos runs. Migrações e frontend/src sem diff no intervalo da correção; frontend funcional não mudou. Sem build/lint global adicional para este diff; baseline global e preservação histórica estrita continuam registrados anteriormente.

## Estado do marco, impacto e continuidade local

CF-020 recupera os critérios financeiros residuais de avaliação e exposição encerrada; CF-021 recupera a leitura de posição atual com custo residual conhecido sem inventar resultado histórico. CF-019 mantém a pendência de confiabilidade/certificação da interação de pagamento120. As tarefas conservam `em_revisao`: a aprovação do reparo não encerra automaticamente cada tarefa inteira.

Impacto efetivamente observado de RVA-03: uma interação ficou sem saída/recuperação visível após pagamento confirmado; não se demonstrou débito duplicado, dívida incorreta, perda de dinheiro ou indisponibilidade geral de pagamentos. Não foi possível determinar em qual promise/fase o fluxo parou, nem se a condição é exclusiva do harness. Isso impede certificar sem ressalvas o cenário afetado e declarar o aceite integrado irrestrito enquanto a pendência permanece; **não demonstra bloqueio geral do fluxo nem bloqueia automaticamente o projeto**. Dona: CF-019, com coordenação/reconciliação pertinente a CF-024; CF-020 participa da jornada compra/exclusão/reembolso, sem novo defeito financeiro demonstrado.

CF-022 (CF-006/017) e CF-023 (CF-002/008/017) continuam aptas a iniciar localmente sobre a base descartável comprovada. Manutenção de lint em CF-026 pode continuar dentro de seu recorte, preservando a pendência de aceite visual/zoom da CF-015. CF-024/025/027/028 conservam suas dependências e não recebem liberação integral por este parecer; investigar RVA-03 não exige congelar trabalhos independentes. Nenhuma tarefa posterior foi iniciada.

Publicação não foi liberada. Permanecem os gates próprios de CF-015 zoom nativo200%, CF-017 RV17-01/RV17-02/adoção real, auditorias CF-023/024/025/027/032 e cadeia de homologação/release, além do lint global preexistente. A ressalva de RVA-03 é delimitada ao cenário/aceite correspondente, não autorização para inventar bloqueio financeiro transversal.

## Custos e trade-offs examinados

Mudança financeira O(1) no cálculo/leitura residual, sem consulta adicional ou N+1; replay continua O(n) por correção, potencial O(n²) acumulado, com locks existentes. A declaração original evita acúmulo de arredondamento e mantém PRICE/TOTAL; mudança econômica de avaliação exige comando explícito/auditoria. O getter passa a representar exposição atual de legado vazio enquanto SQL conserva o bruto: consumidores de histórico/replay devem continuar distinguindo essas semânticas. Uma futura projeção com nome explícito para custo remanescente pode melhorar a clareza do domínio; não foi implementada nem imposta como bloqueio nesta revisão. Cadeia histórica sem base ainda exige reconciliação, e não foi certificada por zeros de exposição.
