# Inspeção das capturas

Imagens reais sem máscara artificial de datas/saldos, sem CSS zoom/DPR alterado. Usuários sintéticos. Viewports informados nos probes. Este registro diferencia conteúdo efetivamente inspecionado de mera criação de PNG; screenshots redundantes/de falha não ampliam o aceite.

| Caminho | Inspeção e conclusão do executor |
|---|---|
| before-targeted/C-private-archived.png | Com privacidade, resumo e linha arquivada mostram1234.56: reprodução RF15-02. |
| before-dates/D-invoice-dates.png |31dez/05jan e ação atrasada contra API05fev: reprodução RF15-04. |
| browser/before-mobile/RF15-01-mobile.png | Botão mobile apenas ícone; ausência do nome comprovada pela árvore/probe, não inferida só pela imagem. |
| browser/after-original/D-invoice-dates.png |31jan/05fev, Adiantar Fatura; datas legíveis. |
| browser/after-final-surfaces/privacy-{dark,light}-{false,true}-{top,negative}.png | Oito capturas inspecionadas. Ativa negativa conserva−R$125,45 em uma linha; arquivada1234.56 em resumo/linha quando normal; ambos mascarados em privado. Cabeçalho e valores legíveis; sem mascaramento no harness. Árvores .txt confirmam ausência dos valores protegidos. |
| browser/after-surfaces/detail-360.png | Captura inicial revelou corte do valor extenso; motivou text-3xl mobile e quebra permitida. Não usada como evidência de correção. |
| browser/after-stable-visual/detail-*.png, browser/after-visual-observed/detail-360.png | Conteúdo interno ainda transparente na captura; rejeitadas como prova visual completa, mesmo com teste funcional verde. Framer/WAAPI exige observar o conteúdo, não só a opacidade do contêiner. |
| browser/final-detail-habit/detail-360.png e detail-768.png | Conteúdo interno confirmado opacity1 antes da captura; valor123456789.12 inteiro, título extenso quebra, data15jan, valores auxiliares, área rolável e ações alcançáveis. No mobile o conteúdo excedente fica na área rolável; não foi confundido com ausência. Foco no fechamento e retorno testados. |
| browser/after-final-surfaces/dates-{America-Sao_Paulo,UTC,Pacific-Kiritimati}.png | Três capturas1440 inspecionadas:31jan/05fev e saldo100 idênticos, SP Adiantar, UTC/+14 Pagar Atrasada no mesmo instante. Esse é o calendário visual deliberado. |
| browser/after-surfaces/matrix-paid.png | PAID, saldo pagável0, compra120, datas corretas e ação Fatura Paga desabilitada; prova estável após reload. |
| browser/after-stable-visual/matrix-goals-today.png | Prazo16jan sem atraso e meta concluída visíveis, barra e textos legíveis. |
| browser/after-stable-visual/matrix-goal-form-bottom.png e matrix-goal-detail-bottom.png | Criar Meta alcançável; detalhe10 itens rola atéItem9, ações Deletar/Aporte permanecem no rodapé. Nomes longos truncados na lista; isso não prova acesso ao texto completo por teclado. Escape do detalhe pendente conforme JSON. |
| browser/after-stable-visual/matrix-investment-history.png e matrix-investment-operation.png | Histórico carregado, compras10 visíveis e dados indisponíveis explícitos; operação tem campos/Confirmar alcançáveis e foco visível. Capturas anteriores durante animação não servem. Retorno de foco falha após fechar. |
| browser/final-detail-habit/matrix-habit-form-bottom.png e matrix-habit-detail.png | Formulário semanal: campos extras e Criar Hábito alcançáveis; detalhe diário: descrição extensa,28 dias, ações visíveis. Calendário usa Brasília. Escape não fecha o detalhe (JSON), sem aceite de diálogo. |

Os probes de imagem foram aperfeiçoados sem alterar o produto: observam estabilidade de estilos/geometria, confirmação da opacidade do conteúdo e seletores do formulário. O clique no centro do card de hábito acionava Marcar Feito; a abertura válida passou a usar foco+Enter no card. O erro posterior de heading duplicado foi restringido ao formulário. Essas primeiras tentativas não são prova de funcionamento do detalhe. Não houve alteração de timeout/retry, CSS ou animações produtivas para esconder defeitos.

Complemento final: todas as oito imagens privacy de `browser/final-accessible-layout/`, RF15-01-created e detail-360 foram inspecionadas novamente após ajustar o wrapper. Ícone/Marcar Feito voltaram à mesma linha; saldos normais preservam sinal/centavos, e os privados permanecem ocultos visualmente e na árvore acessível. `final-privacy-layout` registra a tentativa rejeitada de contents permanente: componente passou, mas browser detectou exposição acessível. A versão entregue restringe contents ao modo normal. As imagens anteriores permanecem históricas, não substituem esse resultado final.
