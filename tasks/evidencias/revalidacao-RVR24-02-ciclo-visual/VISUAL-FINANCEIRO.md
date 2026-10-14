# Interface, captura e persistência

## Garantias separadas

DOM presente não comprova pintura. toBeVisible verifica caixa/visibilidade e não basta para opacidade composta. Captura inspecionada comprova apresentação naquele instante; clique real com actionability, hit-test, digitação e Escape comprovam interação no caminho. O aceite do P2 exige nova instância preservada/utilizável e operação A confirmada ou recuperável, não apenas formulário no DOM ou apenas SQL correto.

Imagens novas efetivamente inspecionadas em browser/: ABA-preserved, lost-preserved, late-recovery-preserved mostram formulário completo, quantidade7/preço3; matrix-investment-operation mostra confirmação/foco em360×800; matrix-investment-history mostra compras/compensações na área rolável. investment-late-selection mostra só detalheB/região vazia apesar do teste funcional aprovado, e investment-confirmed mostra detalheA/preço médio10 com histórico sem pintura. Estas duas capturas continuam insuficientes; não se atribui a discrepância ao P2 sem comprovar remoção/callback obsoleto.

Complemento em interaction/: interaction-preserved.png foi aberto e inspecionado: formulário CICLOB legível, quantidade17, preço3 focado depois de Tab, data/conta/confirmar alcançáveis. Depois da resposta perdida de A, recuperação GET é retida enquanto B fecha/reabre. Após a recuperação, clique real no input, Ctrl+A, digitação17 e Tab funcionam; elementFromPoint atinge o próprio input, todos os ancestrais têm opacity1/visibilityvisible/display ativo. Escape remove somente a operação e devolve foco a Aportar. Sem sleeps novos, alteração de animação, zoom artificial ou relaxamento do timeout. Não houve submissão da nova intenção de B.

Esse complemento resolve a lacuna essencial de interação do P2, mas não explica a ocorrência histórica de15s de opacity0 no histórico. Algumas imagens brutas continuam não certificando pintura; mantê-las como limitação é diferente de manter um fechamento obsoleto já sanado aberto.

## Correlação financeira real

browser/: namespace closure-08dbc3d3, PostgreSQL16 descartável, Flyway1–14, backend/auth15jan2027, JVM UTC/browser São Paulo. As seis jornadas de operação usam fixtures independentes, um BUY2×10 em cada; recibo/posição/conta980 e histórico único após reload. A sétima jornada é o histórico original, que prepara oito compras1×10: não contar suas oito preparações como duplicação de uma intenção.

interaction/: namespace closure-675b7ee0. operationId **76452896-b43a-479f-97e8-b25a6af17663**, recibo INVESTMENT_OPERATION, resultado/movimento **03b51ac4-5d7b-4468-ba9e-1276a0b52e3d**, investment_id **eed8b8f9-9405-407c-a75d-2d4e9ef10b9e**, bank_transaction_id **35b1d978-f6b0-4c68-b26a-73dd59793ff9**. JSON late-recovery contém comando, recibo e leituras; persisted.txt relaciona SQL dos recibos, movimentos, lançamento bancário, saldo e posição. Conta1000→980; A quantidade2/custo20; B zero; um POST, um movimento e um recibo, reaparecem no reload. A resposta é obtida via route.fetch real e sua entrega é controlada/abortada; não há sucesso financeiro falso.

GET de recuperação e releituras não são novos efeitos financeiros. Retry preservando UUID/payload foi exercitado em componente; a garantia backend de replay conserva seus aceites anteriores, não foi reauditoria integral. Nenhum pagamento de fatura novo foi usado para investigar RVA-03.
