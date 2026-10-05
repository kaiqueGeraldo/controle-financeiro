# RVR24-01 — matriz e decisão de representação

Base28e5682, 04/10/2026. FIN-06/NG-01 em docs/sdd/specs/004-regras-financeiras.md; DEC-10 em tasks/evidencias/CF-024/CONTRATO.md. Decisão anunciada antes dos patches; registro textual consolidado durante a implementação.

| Campo/significado | Precisão/limite | Persistência/transporte | Cliente/consumidor |
|---|---|---|---|
| quantity, unidades executadas |12+8, máximo999999999999.99999999, positivo|numeric/BigDecimal; token JSON numérico exato|LosslessNumber token → unidades BigInt; validador de POST/retry/GET|
| price informado |12+8, positivo|numeric/BigDecimal; token exato|mesma conversão, igualdade ao comando e produto HALF_UP|
| price derivado NG-01 |8 casas, pode exceder12 inteiros ou ser zero|BigDecimal/token, apenas descritivo|escala8 e não negativo; não recompõe amount|
| totalValue bruto |12+2, máximo999999999999.99 inclusivo|numeric/BigDecimal/token|centavos BigInt, bruto positivo, soma BUY+fees limitada|
| fees |12+2, não negativo|numeric/BigDecimal/token|centavos exatos iguais ao comando; SELL/proventos fees≤bruto|
| costDelta/realizedResult |dinheiro12+2 quando conhecido; null preservado|snapshot original, token/null|módulo em centavos; sem recalcular custo/ganho|
| amount |texto canônico12+2, autoritativo SELL|entrada string→BigDecimal; bruto no recibo|intenção mantém string original e comparação exata|

Comparar bruto após único HALF_UP do produto quantidade×preço. Entradas monetárias não são arredondadas para caber. Nenhum limite de operação estendido à posição/patrimônio agregado. Snapshot é original, não posição atual.

## Escolha

1. Strings nos DTOs: aderem ao padrão de novos contratos, mas InvestTransactionResponseDTO também serve histórico; exigiriam alterar apresentação/cálculos e contrato HTTP, além da recuperação dos recibos antigos. Não adotado neste recorte.
2. Parser que conserva tokens: adotado lossless-json4.3.0 fixado, sem dependências transitivas novas. Só operação de investimento e GET da intenção INVESTMENT_OPERATION optam por ele. Seis campos financeiros chegam como LosslessNumber (texto exato encapsulado), nunca Number antes da decisão. Campos não financeiros/outros endpoints mantêm contrato. Validador aceita números legados de doubles/comandos existentes e instâncias do parser; strings JSON indevidas continuam rejeitadas.
3. JSON.parse com reviver convencional não recupera dígitos; reviver source exigiria suporte de runtime/browser não estabelecido. Não criar parser próprio nem regex sobre JSON.

Backend GET usa ObjectReader local com USE_BIG_DECIMAL_FOR_FLOATS. DTO HTTP continua numérico; mapper global não muda. POST/replay já têm BigDecimal tipado e token exato. BFF repassa arrayBuffer e não precisa mudar. Recibos/fingerprints/locks/owner/atomicidade/escritas não mudam; nenhuma migração/regravação. Recibo previamente exato é recuperável; dígitos historicamente perdidos não são reconstruídos.

## Consumidores e custos

Busca por investmentService.operation: OperationModal, que entrega resposta ao useCreationIntent/validador e só usa outcome para callbacks. recoverCreation só valida o snapshot. Não há cálculo/apresentação do DTO nesse caminho. getHistory/normalizeInvestmentHistory/InvestmentDetails continuam no endpoint histórico sem alteração. Outros consumidores HTTP não são presumidos inexistentes; o wire permanece compatível.

Intenções v1 guardam comando (números legados e amount string), nunca resultado: sem alteração de storage, UUID ou payload. Comparar o token do resultado ao decimal efetivamente serializado do comando; não inventar casas que já faltavam na entrada numérica legada. A entrada manual/posição atual legadas não foram migradas nesta correção de resultado/recibo.

Parser dedicado é mais lento que JSON.parse, custo linear no corpo pequeno; uma leitura, sem consultas extras/N+1/locks. BigInt limitado por campos contratuais; guarda de1024 caracteres/expoente limita trabalho em tokens abusivos, sem tolerância financeira. Não duplicar cálculo de custo/carteira.

## Provas incompatíveis com a representação

O primeiro probe independente chama JSON.parse cru, exige quantity===1e12 e simultaneamente exige aceitação como máximo legítimo. Sem token original isso é incompatível com FIN-06; passa-lo exigiria flexibilizar a guarda proibida pelo pedido. Arquivo e hash serão preservados e executados antes/depois. Cobertura complementar exige rejeição do objeto já perdido e aceitação do mesmo payload via parser produtivo. Os outros cinco vermelhos exercitam as fronteiras reais e devem passar intactos.

Armazenamento conferido em V1/V5/V7: invest_transactions.quantity numeric(20,8); price numeric(38,8) permite derivado NG-01; total_value, fees, cost_delta e realized_result numeric(38,2). A capacidade do schema não amplia o teto de entrada/operação FIN-06. result_json é snapshot textual. Nenhuma migração/schema foi editada.
