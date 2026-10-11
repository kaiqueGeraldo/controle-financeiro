# Inspeção visual

Capturas foram abertas para inspeção, além das assertions de geometria/DOM. A tabela delimita a amostra efetivamente examinada; arquivos adicionais gerados pelo roteiro não são automaticamente considerados aprovados.

| Captura (relativa a browser, salvo indicação) | Observação e limite |
|---|---|
| visual/review-sao-paulo/768-dashboard.png,360-contas.png,768-cartoes.png,1440-dashboard.png (primeiro roteiro) | Distribuição de resumo/cartões/contas e valores extensos nos recortes; o timeout posterior não apaga essas capturas nem aprova o roteiro inteiro. |
| second/visual/review-sao-paulo/360/360-invoice-long.png | Lista extensa mobile e ação inferior; datas aparentavam divergência, motivando RF15-04 determinístico. |
| second/visual/review-sao-paulo/360/360-modal-light.png | Formulário Nova Transação claro, campos e confirmação no recorte; foco inicial/Escape medidos no probe. Aninhamento e Tab são medidos separadamente na fatura/pagamento. |
| second/visual/review-sao-paulo/360/360-settings-light.png | Preferências em claro, sem corte impeditivo observado; tema após reload. |
| second/visual/review-sao-paulo/768/768-investimentos.png | Indisponibilidade de cotação/posição explícita, não inventa valor de mercado. |
| second/visual/review-sao-paulo/768/768-planejamento-light.png | Compromissos legíveis; vencimento apresentado em novembro contrastou com detalhe do cartão, investigado separadamente. |
| second/visual/review-sao-paulo/1440/1440-resumo-anual.png | Resumo/posição histórica desconhecida explícita; persistência de nota provada por salvar/reload. |
| second/C-accounts-private.png | Saldos ativos mascarados; captura durante transição não fundamenta achado sobre resumo. |
| second/C-accounts-money-mobile.png | Apenas região superior do scroller. Não comprova visualmente o saldo negativo abaixo; DOM/API provam seu valor, e isso é limite visual declarado. |
| second/B-recovery-invalid-mobile.png | Mensagem código inválido legível, formulário mobile, senha mascarada; token exibido inválido. |
| targeted/C-private-archived.png | Valor1234.56 claramente visível em resumo e linha arquivada com privacidade ativada: RF15-02. |
| targeted/C-detail-after-escape.png | Detalhe permanece aberto após Escape; imagem durante animação não sustenta achado de layout. DOM confirma RF15-03. |
| targeted/D-after-payment-120.png | Loading logo após reload. Não é evidência visual de estado pago; usar JSON/SQL para efeito financeiro e manter PAID visual pendente. |
| final/B-download-error.png | Erro de exportação visível; fullPage inclui posição de scroll/layout fixo, não avaliar isso como defeito sem reprodução própria. |
| final-corrected/D-invoice-dates.png | Janeiro2027, FECHA31DEDEZ/VENCE05DEJAN/PagarAtrasada: RF15-04 em360. API e contrato contradizem esses rótulos. |
| ../first-failures/habits-mobile-unnamed.png | Ícone+ visível; árvore sem nome confirma RF15-01. A imagem sozinha não provaria falta de nome acessível. |

Não houve zoom nativo aplicado. Captura180px é apenas viewport estreito suplementar, sem aceite de200%. Não houve saneamento de produto, portanto estas imagens confrontam contratos e histórico, não representam um “depois da correção” dos novos achados.
