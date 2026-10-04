# Precisão: decisão com JSON bruto

Base01d44d8, 04/10/2026. A perda declarada não foi aceita nem reprovada por hipótese. Há impacto demonstrado dentro do domínio permitido, distinto de dinheiro com escala inválida.

## Fronteiras e autoridade

| Campo | Entrada/saída e precisão | Decisão dependente |
|---|---|---|
| quantity, price do comando legado | Frontend InvestmentOperationDTO: number; Java BigDecimal; até12 inteiros/8 casas no preço informado/unidades. UI Number e JSON.stringify podem perder algarismos antes do envio. | Igualdade com snapshot e produto HALF_UP. |
| amount do resgate | String canônica, até12 inteiros/2 casas; DecimalStringDeserializer no backend, amountCents no cliente. | Bruto autoritativo, sem reconstruir por preço descritivo. |
| openingQuantity, openingCost, openingValue | Strings decimais no DTO de abertura e BigDecimal no servidor. Quantidade12+8, dinheiro12+2. | Permitem criar legalmente a posição extrema sem passar a quantidade por Number. |
| quantity/price do resultado | BigDecimal serializado como JSON number; amount SELL produz unidades/preço derivados. Preço descritivo não recebe teto de preço informado. | Nova guarda de faixa/escala da quantidade, correspondência de comando no ramo por unidades. |
| totalValue, fees, costDelta, realizedResult | JSON number; dinheiro com2 casas/12 inteiros; últimos campos admitem null, resultado pode ser negativo. | Teto, soma da aquisição, taxa≤bruto, coerência e confirmação. |
| Recibo result | JSON persistido exato; GET transforma com JsonMapper.readTree; BFF repassa bytes. | Mesmo snapshot deve ser recuperável sem recomputar posição. |

BFF `src/app/api/[...path]/route.ts:88` repassa arrayBuffer. `src/services/api.ts:96–100` lê text e executa JSON.parse. No POST abaixo, a primeira perda observada está nessa conversão para Number; BigInt recebe depois o decimal de Number.toString. No GET, a perda já está no corpo emitido pelo backend, antes de chegar ao browser. `PostgresFinancialIntents.java:54` usa readTree; o JSON persistido exato e o GET aproximado foram confrontados, sem atribuir perda ao PostgreSQL ou ao BFF.

## Caso legítimo NG-01: rejeição indevida

Abertura FIXED_INCOME: quantity string `999999999999.99999999`, custo/valor strings `1.00`. Quantidade está exatamente no máximo permitido (12 inteiros/8 casas). Resgate integral pela UI: amount string `1.00`, quantity/price informados1 (descritivos substituídos pelo servidor). Crédito1, custo baixado1, resultado0, posição final0. Nenhuma operação proibida foi inserida.

POST real [operation-raw.json](precision-observations/browser/operation-raw.json):

```json
{"type":"SELL","quantity":999999999999.99999999,"price":0E-8,"totalValue":1.00,"fees":0,"costDelta":1.00,"realizedResult":0.00}
```

Trecho do corpo completo, UUID/data/origem preservados no arquivo. `JSON.parse` entrega quantity1000000000000. Esperado: confirmar criação válida e permitir recuperação. Observado: boundedUnits(quantity,8) rejeita, outcome unknown e intenção mantida. Não é precisão ilimitada: são exatamente as20 casas significativas admitidas por FIN-06.

SQL de [precision-state.json](precision-observations/browser/precision-state.json): operação e JSON do recibo contêm texto exato `999999999999.99999999`; conta1001, uma operação/bruto1, um recibo/bruto1, um POST. GET real [receipt-raw.json](precision-observations/browser/receipt-raw.json) entrega quantity `1.0E12`, numericamente diferente do original. A UI de recuperação também conserva a pendência. Componente testa os três caminhos POST/retry/GET com Response de texto bruto; quatro falhas no candidato e quatro positivos ao reintroduzir o validador1e9e932 isoladamente comprovam a regressão de aceitação legítima.

O GET aproxima um snapshot persistido que continua exato; não se afirmou alteração do fato financeiro. Backend de produto não mudou neste lote e não se atribui automaticamente a introdução dessa perda à CF-027. É uma fronteira concreta que o saneamento da recuperação precisa considerar.

## Resposta incompatível, porém dentro da escala, aceita

Comando BUY quantity999999999999.0001, price0.00000001, fees0, bruto esperado10000. Resposta bruta fornece quantity`999999999999.00010001`: oito casas/12 inteiros, mas difere do comando em0.00000001. O bruto ainda arredonda para10000; isso não autoriza trocar a quantidade do snapshot da intenção.

Ambos lexemas viram o mesmo Number999999999999.0001. Em [json-precision.test.tsx](json-precision.test.tsx), investmentService/apiRequest reais recebem Response com JSON textual completo. POST e GET devolvem confirmed e removem storage. Esperado unknown/intenção preservada. Não se alegou que o backend emitiu esse DTO adulterado: é fault double na fronteira HTTP. Este falso positivo já ocorre na base1e9e932; o candidato não o resolve. Mesma família RVR24-01, não quatro/seis novos achados.

## Dinheiro e limites do diagnóstico

Não foi demonstrada perda de centavo válido em total/fees/custo/resultado até999999999999.99. O espaçamento binário máximo nessa faixa é cerca de0.000122, bem menor que meio centavo. [json-roundtrip.json](json-roundtrip.json) confere10069 lexemas válidos (10001 centavos próximos do teto e vizinhos de potências decimais), sem falha de round-trip a2 casas. Isso é amostragem fundamentada, não prova universal de qualquer operação em ponto flutuante. BigInt soma/compara centavos após parsing, sem multiplicação Number; amount textual é comparado exatamente.

`999999999999.99001` virar999999999999.99 é caso fora da escala monetária permitida; foi separado e não sustenta o veto. Já as quantidades dos dois casos confirmados estão dentro do domínio. Aceitar representação Number arredondada como substituta de precisão contratual altera decisões reais de sucesso/pendência.

Correção necessária é preservar a precisão dos campos de execução/recibo na fronteira afetada e consumir o snapshot coerente, incluindo recuperação backend. Não se exige migração geral de contratos para strings, biblioteca financeira global ou precisão arbitrária. Não resolver com epsilon, teto maior, clamp ou remoção das guardas legítimas.
