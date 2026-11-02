# Consumidores afetados e custo

## Contrato real revalidado

O diff não altera milestone-remediation.integrated.spec.ts nem o produto. A busca de uso confirma que SAN-E2-visual é o consumidor afetado. Exige texto exato, contagem 1, scroll da região e expect.poll(...).toMatchObject({ok:true}) em cada largura. Resultado inconclusivo/false não satisfaz esse gate; exceção/ausência não produz aprovação. Depois do gate, uma segunda chamada escreve o recibo de diagnóstico; esse arquivo não é o gate. Nesta execução independente também conferimos que todos esses recibos eram painted e sem falhas.

| Largura×altura | Resultado | Clip do helper | Alterados | Externos/direção/núcleos ausentes |
|---|---|---|---:|---|
| 360×900 | painted | 216×18 CSS px | 1614 | 0/0/0 |
| 768×900 | painted | 216×18 CSS px | 1614 | 0/0/0 |
| 1440×900 | painted | 216×18 CSS px | 1614 | 0/0/0 |

As capturas das três larguras foram inspecionadas. O motivo completo aparece no card de rentabilidade indisponível e a carteira mostra SANVIS com avaliação indisponível. Isso sustenta o cenário atual; não é medição de contraste nem certificação de acessibilidade.

O probe real original criou RVLIVE com nome Entidade independente exata, abertura 10/200 e sem avaliação conhecida. A referência de entidade é o ID retornado, reencontrado após reload: 59dc3224-dae1-4c00-9e02-2af901d3bff3, ticker RVLIVE, quantidade 10, totalCost 200, valuationAmount null. Baseline e restaurado foram painted; filter-opacity e pointerless-overlay foram inconclusive, por no-glyph-paint/ambiguous-glyph-paint, com locatorVisible=true. Logo o resultado não decorreu de erro de identidade/preparação ou mera visibilidade do locator.

Ambos os wrappers passaram (um caso Playwright em cada); nenhuma falha pré-helper de cadastro/sessão nesta execução. O probe original confirma continuidade por reload/leitura do backend; os controles de restauração também exercitam botões após falhas. Nenhuma interceptação falsa da API financeira foi adicionada. Foco, interação e outros requisitos não são inferidos desse helper e mantêm seus contratos próprios.

## Medição delimitada

A medição anterior conferida é 178,5299 ms, arredondada para 179 ms, em cinco chamadas. Foi repetido o mesmo script e fixture: Windows, Node 24.18.0, Playwright 1.63.0, Chromium headless 153.0.8010.12; Arial 14 px, peso 600, badge sobre gradiente, viewport 360×900 e clip 214×16 pixels CSS.

Nesta repetição: cinco chamadas, 15 capturas, mínimo 163,23 ms, mediana 180,11 ms, máximo 314,74 ms. Todas as cinco observações foram painted. Mantido o primeiro custo mais alto; não houve exclusão de amostras nem ajuste de limiar. Instrumentação de memória/IPC está incluída no tempo observado.

Máximos amostrados: Node RSS 190.971.904 bytes, heap Node 86.289.440 bytes, heap JS do renderer 3.627.396 bytes. São amostras de processos com bibliotecas carregadas, não memória exclusiva do helper, pico completo, RSS do navegador/GPU ou benchmark do backend. Não há inferência de produção, Linux, outros tamanhos de DOM ou toda a expanded.

SAN-E2 faz no mínimo seis chamadas bem-sucedidas (poll + recibo em cada largura), logo no mínimo 18 capturas internas, além das três screenshots finais da jornada. O poll pode repetir; não se afirma contagem exata instrumentada de tentativas. A mediana de uma fixture não deve ser multiplicada e apresentada como tempo comprovado da jornada. Limite de área não limita o custo dos snapshots de todo o DOM.
