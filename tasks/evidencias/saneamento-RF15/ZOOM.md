# Zoom nativo 200% — pendente

11/10/2026, execução do saneamento, sem aceite independente.

Foram lidas integralmente as instruções de computer-use (SKILL.md, guidance,
api e confirmations) e a documentação da alternativa cua_repl/Chrome.

1. Probe original `cf015.native-zoom.integrated.spec.ts` intacto, via harness
   RF15 e PostgreSQL descartável: Chrome for Testing 153.0.8010.12.
   `ready.json`: janela 1440×1000; viewport1424×905; DPR1; escala visual1.
   A janela intitulada `CF015 ZOOM NATIVO - ajustar 200%` foi localizada.
   `sky.get_window` recusou o identificador9635076:
   `window id 9635076 no longer belongs to Chrome; current owner is Chrome`.
   A única recuperação permitida (nova listagem/seleção) repetiu o erro.
   Nenhum input enviado. O probe mantém o timeout original e a falha.
2. Alternativa cua_repl: inventário não expôs apps nativos; documentação do
   navegador oferece viewport e locators, sem API documentada para zoom nativo.
   Não foram usados viewport, CSS, DPR, CDP pageScale nem escala visual como prova.
3. Alternativa suportada `channel: chrome` do Playwright, com perfil temporário
   isolado e Clock de UI fixo15/01/2027. Chrome154.0.8037.58; mesmas métricas
   iniciais1424×905/DPR1/scale1. Janela19071448 localizada com título RF15.
   Ao selecionar/observar essa janela, Computer Use encerrou a operação porque
   não conseguiu determinar a URL atual com confiança suficiente para aplicar
   sua política. Nenhum input de zoom foi enviado; nenhuma nova tentativa ou
   contorno do bloqueio foi feito. Probe e log permanecem como limitação.

Evidências: `browser/native-zoom/` e `browser/native-chrome/`, incluindo os
respectivos `visual/native-zoom/ready.json`. Ausência de `native-confirmed.txt`
é intencional: não houve confirmação real de200%. Não há captura certificada
de conteúdo/foco/scroll a200%. CF-010/015 continuam em_revisao neste critério.
