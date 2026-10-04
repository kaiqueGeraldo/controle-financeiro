# RVR24-01 — continuação residual, P2 — teto monetário ausente

04/10/2026; candidato a93c52f, entrega e069e33. Mantém o identificador existente: nova manifestação da confirmação de resposta financeira incompatível. Não são quatro achados nem reabertura de RVR24-02/RV24-02.

**Defeito confirmado no cliente por fault double de resposta.** Arquivo `controle-financeiro-frontend/src/services/creationResult.ts`, linhas 51–57, especialmente 52: apenas centavos representáveis são exigidos; a igualdade decimal do bruto não exige o teto monetário.

Reprodução em [decimal-independent.test.tsx](decimal-independent.test.tsx), quatro últimos casos; [log isolado](decimal-limits.log) e [gate final](components-final.log):

1. Comando BUY, quantity1000000, price1000000, fees0, data2027-01-15. Quantidade e preço individualmente cabem nos 12 inteiros/oito decimais permitidos.
2. Resposta com os mesmos campos, UUID válido, dateOrigin USER_INPUT, costDelta/realizedResult null e totalValue1000000000000. O produto é matematicamente exato; o total tem 13 inteiros e excede999999999999.99 em0.01.
3. O parser não lança erro. Os probes do hook entregam a resposta por POST, retry e recuperação autenticada simulada com kind/UUID corretos.
4. Observado: outcome `confirmed`, pending null e sessionStorage removido. No retry/GET, soft assertions mostram também perda do envelope original. Esperado: erro financeiro controlado, outcome unknown e conservação do mesmo UUID/payload, sem autorizar conclusão.

Controle positivo no mesmo teste: quantity1000000×price999999.99999999, bruto999999999999.99, é aceito. A primeira assertion passa; a falha é a aceitação de um centavo acima, não erro de importação ou ambiente. Não há epsilon ou expected derivado da função testada.

**Contrato:** SPEC-004/FIN-06 estabelece teto de12 inteiros para dinheiro e exige que o produto caiba; RV24-01/critério4 e CF-009/critério2 proíbem falso sucesso. O fato de ambos os operandos caberem não torna admissível o produto. FIN-04/NG-01 não autorizam exceder teto do total monetário; apenas permitem preço descritivo derivado que não caiba no teto de preço informado.

**Impacto:** cliente encerra a pendência por um DTO que não pode representar criação válida nesse contrato. Severidade P2, igual ao resíduo anterior: prova por resposta induzida, sem duplicação econômica ou emissão real desse DTO pelo servidor. A leitura de InvestmentService:169–170/355–359 confirma rejeição backend pelo limite; ela não foi usada para inventar o expected normativo. Não se afirma bypass do backend.

**Responsável:** RV24-01, mesmo RVR24-01; mantém CF-009/2 pendente. Não transferir para CF-026, CF-027 ou onboarding.

**Encerramento objetivo:** validar também a faixa monetária do bruto comum aos caminhos POST/retry/GET, com comparação decimal exata; rejeitar1000000000000.00 e manter999999999999.99 válido. Preservar envelope/callbacks diante da resposta incompatível e recuperar depois com recibo válido. Não impor teto de preço informado ao preço descritivo do SELL monetário. Passar estes quatro vermelhos, os três originais e regressões dirigidas; manter a jornada real com corrupção somente no harness. Não é necessário repetir a revisão CF-025–027.

## Hipóteses e limites

Sem novo defeito de backend/SQL, lifecycle, exclusão ou NG-01 demonstrado. H-RV24-01 ECONNRESET continua investigação histórica inconclusiva; não ocorreu nesta jornada e não se encerra por isso. RVA-03 e RJ-022-01/H24-01 não foram investigados nem reproduzidos aqui. O veto atual decorre do teto confirmado, não dessas investigações.
