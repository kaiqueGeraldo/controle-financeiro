# Inspeção das capturas do executor

Chromium local, relógio fixo 2027-01-15T12:00:00Z, backend e PostgreSQL descartáveis. Fixtures e ações reproduzíveis nos testes e JSON adjacentes. Imagens inspecionadas diretamente, sem edição. Esta inspeção não aprova CF014/015.

| Captura/rodada | Observação e limite |
|---|---|
| browser-before-ready/investment-late-selection.png | Detalhe B presente, operação B removida após entrega A. Assertion original vermelha confirma remoção; SQL confirma o commit A. |
| browser-after-original e browser/after | Capturas inspecionadas mostram detalhes, sem pintura da operação esperada, embora DOM/assertions passem. Não certificam apresentação do formulário. |
| browser/paint-observation/paint-observation.png | Formulário PINTURA legível, campos, fechamento e ação dentro de 1440×900. Observação sem movimento financeiro: sete amostras de opacidade0, depois1, aproximadamente cinco segundos entre primeira e última amostra. Não estabelece causa para histórico invisível. |
| browser/final/ABA-before-delivery.png e ABA-preserved.png | Nova instância A visível antes da entrega antiga, com intenção anterior explicitada; depois permanece com rascunho7/preço3 e indicação de foco na quantidade. |
| browser/final/lost-before-delivery.png | Camada de operação não aparece na imagem apesar da checagem prévia de opacidade. Captura insuficiente para apresentação anterior; preservada como limitação. |
| browser/final/lost-preserved.png | B permanece visivelmente aberto após recuperação A, com rascunho7/preço3 e foco na quantidade. |
| browser/final/late-recovery-before-delivery.png | B visível, intenção anterior CICLOA identificada, consultar recibo/repetir mesma intenção e demais campos legíveis. |
| browser/final/late-recovery-preserved.png | Apenas detalhe B aparece. DOM, campos e foco foram verificados, mas a captura não comprova pintura da operação reaberta. Limitação residual explícita, mesmo com opacidade1 observada antes da captura. |
| browser/final/investment-late-selection.png | Camadas parcialmente transparentes e operação não legível. Prova original funcional passou; captura não certifica apresentação. |
| browser/final/investment-confirmed.png e investment-lost.png | Detalhe A presente e preço médio10; área inferior do histórico sem conteúdo pintado. Mantém a ocorrência visual separada, sem alegar resolução. |
| browser/final/matrix-investment-history.png | Em 360×800, detalhe e duas compras visíveis; conteúdo longo em área rolável. Prova original verifica histórico, Escape e foco, sem certificar todas as linhas numa só captura. |
| browser/final/matrix-investment-operation.png | Em 360×800, operação, campos, fechar e confirmar legíveis; foco visível na confirmação, sem recorte da ação. |

As assertions funcionais de sete jornadas passaram, incluindo teclado, foco, manutenção do formulário e persistência; duas capturas complementares posteriores (ABA e lost) mostram o formulário preservado. Isso não torna válidas as demais capturas insuficientes. Não se atribui a discrepância à mesma causa do fechamento obsoleto: antes havia remoção comprovada do formulário, depois os estados/controles permanecem nas provas funcionais.

Próximo experimento da investigação visual, se autorizado separadamente: instrumentar passivamente os frames imediatamente antes/depois de screenshot e correlacionar estilo, animação/composição e histórico, usando fixture sem novo pagamento. Nenhum timeout foi aumentado, nenhuma assertion original alterada, nenhuma repetição indefinida feita para obter imagem verde. Zoom nativo200 e RVA-03 continuam fora deste recorte.
