# Inspeção visual realizada

Imagens efetivamente abertas: accounts-animation-stable, goal-before-escape, habit-before-escape, calendar-UTC-visibilitychange, privacy-light-false-negative, detail-360 e privacy-mid-transition em `browser/`; matrix-investment-history, matrix-investment-operation e RF15-01-created em `browser-isolated/`; habit-legitimate, investment-confirmed, investment-lost e investment-late-selection em `browser-extra/`; captura test-failed-1 do cenário original de histórico em `browser/artifacts/`.

Contas mostram máscara estável/arquivada; negativo normal e moeda extensa mobile legíveis; transição suplementar mantém valores mascarados. Meta/hábito longos mantêm área rolável e ações. Calendário mostra janeiro2027, fechamento31jan/vencimento5fev com atraso sem trocar competência. Hábito legítimo reaparece salvo após reload. Histórico isolado mostra movimentos e compensações; operação aninhada exibe confirmação e foco.

A captura original de falha tem histórico vazio, coerente com opacity0 por15s. Nas capturas extras de operação confirmada/perdida, a captura ocorreu sem esperar estabilização da animação: há região de histórico vazia e, na resposta perdida, fundo de diálogo sem conteúdo. Não representam aprovação visual desses estados nem uma segunda medição de 15s. A imagem A→B mostra detalhe B e ausência do formulário que deveria continuar aberto, corroborada pelo estado DOM e pelo teste isolado.

Demais arquivos são evidência auxiliar automatizada, não alegação de inspeção manual integral. Nenhuma captura substitui zoom nativo. Traces foram usados para extrair a sequência de rede do cadastro inicial e localizar as falhas; não se afirma revisão quadro a quadro de todos os traces.
