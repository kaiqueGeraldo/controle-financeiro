# Inspeção visual do executor

Capturas abertas e inspecionadas, além das assertions funcionais. Chromium local, animações habilitadas, dados sintéticos, PostgreSQL descartável. As imagens não constituem aceite independente ou zoom nativo.

| Capturas relativas a browser/ | Observação e alcance |
|---|---|
| before/goal-after-escape.png; before/habit-after-escape.png | Diálogos ainda abertos após Escape, corroborando falhas funcionais anteriores. |
| before/accounts-animation-first.png | Captura já pode mostrar máscara; não comprova sozinha o frame exposto. A reprodução é sustentada pelas amostras de alpha do probe original e pela evidência histórica do revisor. |
| after-final/accounts-animation-stable.png; privacy-mid-transition.png; privacy-data-change.png; privacy-released.png; privacy-transition.png | Valores ocultos nos estados protegidos, inclusive após novos dados. Liberação mostra total 1.734,56 e contas 1.234,56/500,00. Transição ancestral controlada é complemento; animação original tem probe separado. |
| after-final/privacy-{dark,light}-{false,true}-{top,negative}.png | Oito imagens: arquivada 1.234,56, negativa -125,45, subtotal 1.109,11 e zero legíveis no modo normal; máscaras sem algarismos no modo privado, nos dois temas, 360×800. Reload/árvore acessível cobertos pelas assertions. |
| after-final/midnight.png; calendar-{America-Sao_Paulo,UTC,Pacific-Kiritimati}-{focus,visibilitychange}.png | Ação Pagar Atrasada após virada local; fechamento 31/jan, vencimento 05/fev e competência janeiro preservados. Seis recortes mobile legíveis. Eventos de visibilidade despachados em documento visível; não é experimento de suspensão nativa do SO. |
| after-final/goal-before-escape.png; goal-nested-return.png | Checklist longo rolável e ações disponíveis; após Escape da confirmação, somente a camada filha some, com retorno ao acionador de remoção. |
| after-final/goal-after-escape.png | Capturada ainda durante saída, escura/desfocada: insuficiente para demonstrar estado final. Preservada como limitação de captura, não descartada. |
| goal-visual-final/goal-after-escape-settled.png | Complemento após assertion de ausência do diálogo: lista nítida, sem backdrop, anel de foco na meta. Teste original do executor preservado e acrescido desta espera observável, sem sleep/retry. |
| after-final/habit-before-escape.png; habit-after-escape.png; habit-rapid-escape.png | Descrição longa/calendário e ações cabem com rolagem. Após Escape, lista e foco no acionador; dois Escape cancelam edição e fecham. habit-writes.json vazio confirma ausência de PUT indevido. |
| investment-final/matrix-investment-history.png; matrix-investment-operation.png | Histórico longo rolável, ações acessíveis e operação sobre detalhe preservado, foco visível. Estados indisponíveis apresentados explicitamente. Retorno a Aportar validado no teclado. |
| after-final/detail-360.png; detail-768.png | Regressão RF15-03: valor extenso e título legíveis, área interna rolável e rodapé acessível. 768 mostra todo detalhe; 360 demanda rolagem. |
| after-final/RF15-01-mobile.png; RF15-01-created.png | Botão mobile e resultado de criação presentes; nome, Enter e reload conferidos por prova original. Não reabre o aceite RF15-01. |

Não se certifica toda a apresentação por ausência de overflow/console. O alcance é exclusivamente dos recortes acima. As capturas intermediárias permanecem com seus logs, inclusive falhas de montagem de fixture e diagnóstico com pausa; não são tratadas como resultados finais.
