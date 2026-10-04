# Oráculos independentes — 04/10/2026

Base e069e33, funcional c45bfb6..a93c52f. FIN-04 e FIN-06 da SPEC-004 definem bruto por unidades (BUY/SELL/proventos), produto decimal exato e HALF_UP a centavos antes de taxas. FIN-04 define resgate monetário por montante; NG-01 preserva avaliação TOTAL e torna preço derivado informativo. DEC-10 exige snapshot original, não posição atual. Portanto não há ambiguidade normativa indispensável neste resíduo.

Esperados literais adicionais: 1×0.01499999→0.01; 1×0.015→0.02; 1×0.01500001→0.02; 0.33333333×3→1.00; 0.00000001×999999999999→10000.00. Bruto1.01 com taxa0.01 continua1.01, líquido1.00; aquisição custa1.02. Taxa igual ao bruto admite líquido zero na venda/provento, sem bruto zero. Valores do teste são literais, sem importar aritmética produtiva.

Resgate amount0.50/quantidade100000000/preço derivado0.00000001 mantém bruto0.50, embora recomposição dê1.00; amount999999999999.99 com quantidade mínima e preço derivado grande continua admissível como snapshot descritivo. Custo/resultado null não viram posição recalculada. Mudança posterior da carteira não altera recibo.

Limites normativos: 12 inteiros, oito decimais em unidades/preço informado, duas em dinheiro; produto deve caber em dinheiro. Examinar separadamente os limites reais de Number e do algoritmo, sem confundir guard de resposta com validação integral do comando pelo servidor. Inputs não finitos, negativos, tipos errados e escala excessiva devem rejeitar sem crash aritmético.

Contraprova: mesmos bytes do teste independente original em cópia externa; trocar exclusivamente creationResult.ts pela base c45bfb6, esperar três falhas financeiras, restaurar bytes candidatos e exigir quatro verdes. Nenhuma mutação na árvore principal.

Integração: reexecutar harness publicado em pasta nova; POST real BUY200, adulteração999 após resposta real; SQL intermediário800/uma operação/um recibo; GET também adulterado, posterior GET válido/reload. Um POST não significa ausência de GETs. Chromium apenas; não encerra a investigação histórica ECONNRESET por ausência nesta execução.
