# Capturas inspecionadas nesta revisão

Imagens abertas e examinadas, não aceitas somente por geração/asserção geométrica. Caminhos relativos a esta pasta. Demais imagens produzidas são evidência auxiliar, sem declaração de inspeção individual.

| Imagem | Leitura e decisão |
|---|---|
| browser-directed/C-private-archived.png | Linha arquivada coberta; resumo/conta corrente ainda com1234.56 tênue durante transição. Motivou observação passiva específica, sem considerar o frame um aceite estável. |
| browser-directed/privacy-dark-true-top.png | Depois de estabilizar, resumo e arquivada visualmente ocultos; snapshot acessível também protegido. Não elimina a exposição na transição. |
| browser-directed/privacy-light-false-negative.png | Saldo negativo−R$125,45 legível em 360px, sinal/centavos completos. |
| browser-directed/D-invoice-dates.png | Janeiro2027, Fecha31jan/Vence 05fev, compra15jan, açãoAdiantar. Contrasta corretamente com o original errado. |
| browser-directed/RF15-01-created.png | Hábito criado com açãoMarcarFeito; nome/semântica/foco da criação são aferidos pelo browser, não por pixels. |
| browser-directed/matrix-paid.png | StatusPAGA, saldo pagável0, consumo original120, botãoFaturaPaga desabilitado. API/SQL/reload confirmam. |
| browser-directed/detail-360.png | Receita extensa, valor123456789.12 e controles visíveis; área rolável abaixo; foco de fechamento indicado. |
| browser-directed/matrix-goals-today.png | Prazo16jan exibido semAtrasado e metaConcluído. Backend criara no dia 15; não prova admissibilidade de criar com prazo hoje. |
| browser-directed/matrix-goal-detail-bottom.png | Itens 7–9 e ações inferiores alcançados por scroll. JSON confirma que Escape não fecha; geometria não aprova teclado. |
| browser-directed/matrix-habit-detail.png | Descrição longa/calendário28dias/contextoBrasília/ações visíveis. Form permanece apósEscape; semrole=dialog. |
| browser-directed/matrix-investment-operation.png | ConfirmarOperação dentro da viewport e focado. ApósEscape focoBODY; não aprova retorno apesar do modal visualmente operável. |
| browser-directed/dates-Pacific-Kiritimati.png | Mesma data civil05fev, saldo parcial 100 e açãoPagarAtrasada no dia 06local. |
| browser-extra/midnight.png | Fatura aberta após meia-noite/foco ainda mostraAdiantarFatura. Clock local e payload emmidnight.json distinguem isso da montagem em horário novo. |
| browser-extra/accounts-animation/accounts-animation-first.png | Texto tênue sob máscara; primeira observação técnica. Leitor de strings tinha samplealpha 0, explicitamente excluído da conclusão. |
| browser-extra/accounts-alpha/accounts-animation-first.png | Exposição de 1234.56 claramente observável durante transição; leitor numérico confirmou17samplesalpha>0, máximo 0.224704. Falha permanece com probe corrigido. |

Tema nas provas surfaces é forçado explicitamente pelo harness para comparação visual; persistência de preferência de tema conserva o aceite anterior CF011, não é derivada dessa manipulação. Capturas não aplicam máscara sobre valores de teste nem zoom artificial. Zoom nativo 200 continua sem inspeção certificada.
