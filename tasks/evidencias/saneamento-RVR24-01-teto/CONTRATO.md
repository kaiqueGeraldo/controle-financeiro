# Matriz contratual antes da correção — RVR24-01 / teto

Base 1e9e932, 04/10/2026. [FIN-04/06 e NG-01](../../../docs/sdd/specs/004-regras-financeiras.md),
[DEC-10](../CF-024/CONTRATO.md), [parecer/achado](../revalidacao-RVR24-01-bruto/ACHADOS.md).
FIN-06 exige 12 algarismos inteiros: dinheiro tem máximo **999999999999.99**
inclusivo (99999999999999 centavos); o próximo centavo é1000000000000.00.
Unidades/preço informado: máximo999999999999.99999999 inclusivo, escala8.
Bruto é produto exato arredondado HALF_UP uma vez para escala2; comparar o
resultado arredondado, não exigir que os operandos individualmente limitem o produto.
Dinheiro informado não é arredondado para caber. Não há epsilon nem clamp.

| Regra | Campo/operação | Ponto de validação planejado | Prova |
|---|---|---|---|
| FIN-06 faixa/escala monetária, positivo | totalValue em BUY/SELL/DIVIDEND/INTEREST, incluindo amount | Guarda comum em validateInvestmentResult antes de complete, centavos BigInt | Quatro probes originais; abaixo/no/acima do teto; cruzamento do teto por HALF_UP |
| FIN-06 quantidade positiva, escala8 e12 inteiros | quantity da execução ou resgate | Mesma guarda, unidades BigInt | Menor unidade1e-8; excesso1e-9; primeiro inteiro de13 dígitos; máximo representável abaixo do teto legado |
| FIN-06 preço informado positivo, escala8 e12 inteiros | price somente no ramo sem amount | Validação do produto já existente, agora com faixa dos operandos | Preço acima do teto com produto pequeno; bordas decimais anteriores preservadas |
| FIN-04/06 taxa monetária não negativa | fees em todas as modalidades | Centavos com faixa e igualdade ao comando, já exigida | Taxa fora da faixa/escala; abaixo/no/acima do teto |
| FIN-04 líquido não negativo | SELL/proventos: fees≤bruto; igualdade permite líquido0 | Comparação dos mesmos centavos, sem calcular carteira | Taxa igual ao bruto aceita, superior rejeitada |
| FIN-04/06 aquisição inclui taxa | BUY: bruto+taxa deve caber em dinheiro | Soma exata em centavos, sem reconstituir posição | Soma exatamente no teto e um centavo acima |
| FIN-06 dinheiro do snapshot | costDelta/realizedResult quando conhecidos | Faixa/escala pelo módulo do valor; preservar null e resultado negativo | Centavo acima, escala inválida, negativo válido; sem recalcular custo histórico |
| FIN-04/NG-01 total informado é autoritativo | SELL amount | Ler string decimal canônica diretamente em centavos, sem Number intermediário; igualdade com totalValue | String abaixo/no/acima do teto, inteira ou com centavos; rejeitar zeros à esquerda/espaços/excesso de escala |
| NG-01 preço descritivo não recompõe total | SELL com amount | Manter finitude/não negatividade, sem teto de preço informado | Preço derivado grande ou zero continua aceito |

Escopo é o snapshot de criação de investimento, não patrimônio, carteira,
saldo acumulado ou avaliação atual. Não estender este teto indiscriminadamente
a agregados ou preços derivados. O validador de transação não será refatorado.
Snapshot recuperado é o original, não projeção da posição atual; não recomputar
custo/ganho nem tornar null conhecido. Campos monetários conhecidos só recebem
faixa/escala, não reimplementação da cadeia financeira.

Os números do DTO legado já são Number; representação decimal é convertida
em inteiros para comparação exata, sem multiplicação binária. Nos limites de
unidades/preço, Number não representa o último incremento1e-8 junto a12 inteiros:
não inventar precisão perdida. Testar esse incremento em magnitude representável
e o maior Number decimal contratual representável no limite superior, registrando
a limitação. amount string preserva todos os dígitos e escala de entrada.

Todos os caminhos compartilham validateInvestmentResult. Incompatibilidade mantém
unknown/UUID/payload; não comprova ausência de commit. Não há necessidade de
alterar HTTP/schema/recibo/fingerprint, lifecycle ou aceites de outras tarefas.
