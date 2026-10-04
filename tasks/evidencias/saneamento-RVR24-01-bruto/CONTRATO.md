# Oráculo registrado antes da implementação — RVR24-01

Base c45bfb6, 04/10/2026. Três probes independentes falharam causalmente em
POST/retry/GET; controle positivo passou. Arquivo original e cópia executada:
SHA-256 0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143.

Fontes normativas: [FIN-04/06 e NG-01](../../../docs/sdd/specs/004-regras-financeiras.md),
[DEC-10](../CF-024/CONTRATO.md), [achado independente](../revisao-CF-025-CF-027-RV24/ACHADOS.md).
Não há ambiguidade necessária à correção: modalidade por unidades tem bruto
calculado; resgate por amount preserva o bruto informado.

| Modalidade | Autoritativo | Derivado / coerência exigida |
|---|---|---|
| BUY/SELL/DIVIDEND/INTEREST sem amount | Quantidade e preço de execução do comando; taxa informada | totalValue é bruto: produto decimal exato arredondado uma única vez em centavos HALF_UP. Taxa não integra bruto; não confundir líquido/custo com total |
| SELL monetário | amount do comando | totalValue deve coincidir com amount; quantidade/preço são derivados pelo servidor. Não reconstruir total pelo preço arredondado a oito casas, inclusive zero descritivo |
| Custo/resultado histórico | Snapshot devolvido e preservado no recibo | Ausência histórica pode ser null. Não reconstruir custo a partir da posição atual, preço médio ou cotação. Esta correção não reimplementa cadeia de custo |

FIN-06 admite até oito casas em quantidade/preço e dinheiro em centavos.
Oráculos literais: 2×100→200; 1×1.005→1.01; 1×1.004→1.00;
0.125×10.04→1.26. NG-01 conserva totais informados com preços descritivos
arredondados; esses preços não são o preço de execução de uma compra por unidades.
UPDATE_BALANCE é avaliação, fora da criação identificada; não será alterado.

Fluxo: investmentService.operation → apiRequest.data → hook start/retry →
validateCreationResponse → validateCreationResult → complete → removeItem →
confirmed → callback do modal. Recuperação: GET autenticado por ID → envelope
operationId/kind → mesmo validateCreationResult → complete. Hoje o ramo sem
amount só confere total positivo, permitindo 999 apesar de quantidade2/preço100.

Implementação planejada: um cálculo decimal delimitado ao bruto em creationResult,
com coeficientes BigInt da representação decimal dos números do contrato legado,
sem multiplicação binária, epsilon ou alteração do comando. Mesma regra em envio,
retry e recuperação pelo validador existente. Não calcular avaliação, custo ou
ganho; manter guards estruturais e de lifecycle. Escala inválida não será truncada.
Complexidade proporcional aos dígitos decimais (limitados pelo contrato), sem I/O,
queries ou nova dependência. Aceita sintaxe exponencial emitida por Number.toString
para pequenos números legados; não muda o contrato dos novos payloads string.

Incompatibilidade lança o erro local já existente: unknown e intenção preservada.
Não comprova ausência de commit. Somente resultado coerente e execução ainda ativa
permitem complete. A recuperação posterior válida conserva a mesma identidade.
O custo de repetir uma relação de contrato na fronteira é limitado e explícito;
o backend continua autoridade de execução, posição, locks e atomicidade.
