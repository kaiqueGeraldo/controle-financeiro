# Decisões e resíduos independentes

Base de produto: db2d77d. Não houve correção de produto nesta revisão. Caminhos relativos à raiz. Os IDs originais não foram multiplicados para representar a mesma causa.

## RF15-01 — encerrado no recorte original

Nome e semântica do botão em 360px, Enter abre a criação, foco inicial no fechamento, Escape retorna ao acionador. Criar hábito por teclado mantém acionador/foco, novo GET após reload confirma o hábito. Prova independente em browser-directed/RF15-01-mobile.png, RF15-01-created.png e playwright.log. Mudanças em habitsScreen/newHabitModal não aprovam detalhe customizado de hábito, tratado abaixo.

## RF15-03 — encerrado no detalhe do extrato

Original C passou. Browser dirigido confirma acionador por teclado, foco inicial, Tab/Shift+Tab contidos, Escape cancela edição antes de fechar, segundo Escape fecha e retorna, reabertura e conteúdo longo em 360/768. Prova extra altera realmente o rascunho, cancela, reabre edição com descrição original e confirma ausência de persistência do rascunho após reload. body overflow liberado e Tab fora do diálogo após fechar. Componentes reais testam pilha/camada, Escape defaultPrevented e cleanup; essa parte não é rotulada como browser de diálogo aninhado do extrato. Evidências browser-directed/detail-360.png, detail-768.png, browser-extra/playwright.log e components.log. Sem inferir aceite para consumidores não examinados.

## RF15-02 — correção parcial; exposição na transição mantém achado aberto (P1)

Saldos arquivados agora usam a máscara; valores e nomes monetários da árvore acessível ficam ocultos. Prova original C, contas ativa negativa/arquivada, dois temas, false→true→false e reload passaram. Componente lista/detalhe alterna valor principal, efeito no caixa, bruto e restante; probe browser extra verifica navegação com preferência persistida e árvore do extrato, sem exposição nessa transição. Quando desligada, sinal/dígitos/centavos continuam legíveis. Não se promete sigilo de DOM/rede nem atualização imediata entre abas: essa garantia não consta do contrato.

**Resíduo confirmado na superfície de contas:** `controle-financeiro-frontend/src/components/ui/privacyBlur.tsx:15–18` mantém transition-all duration-300 ao ocultar texto. Criar conta 1234.56, arquivar, persistir privacyMode=true e carregar /contas em 360px. Esperado por AC-UI-003/DEC06: valores protegidos não reaparecem durante renderização. Observado: subtotal/conta corrente mostram 1234.56 brevemente com alpha positivo antes de chegar a transparente. A primeira captura original C já registrou o texto tênue; a prova passiva por frame confirmou rgba branco alpha 0.05 e azul alpha 0.051716, em elementos dentro da viewport com opacidade ancestral 0.949 e aria-hidden=true. Após estabilização a imagem e árvore ficam protegidas.

Evidências: browser-directed/C-private-archived.png, browser-extra/accounts-animation/accounts-animation.json e accounts-animation-first.png, comparação accounts-animation-stable.png. O primeiro probe também registrou uma amostra rgba com alpha 0 por comparar strings; essa amostra não fundamenta o achado. Leitura numérica de alpha corrigida em probe separado, preservando primeira ocorrência. Somente frames com alpha positivo sustentam exposição; árvore acessível permaneceu protegida. Não se alega que o valor arquivado fique permanentemente exposto como antes.

Confirmação com leitor numérico em browser-extra/accounts-alpha:17 amostras, alpha mínimo 0.0016852 e máximo 0.224704, primeiro frame com opacidade ancestral 0.975816. Imagem accounts-animation-first.png inspecionada mostra R$1.234,56 sob a máscara. Probe permanece vermelho; nenhum sample alpha 0 é necessário à conclusão.

Impacto: preferência visual ativa ainda permite leitura transitória dos valores; P1 mantido no requisito de privacidade. Encerrar removendo transição da propriedade que oculta o conteúdo (ou garantindo máscara opaca imediata), sem perder geometria/aria-hidden. Revalidar frames na navegação/reload e alternância, além do estado estável claro/escuro. Evitar refatorar todos os consumidores: o problema residual está no comportamento compartilhado de ocultação, com CF012 dona do achado e CF010 responsável pelo componente.

## RF15-04 — datas corrigidas; resíduo de atualização mantém achado aberto (P2)

Origem das datas aprovada: LocalDate persistidos em Invoice, DTO closingDate/dueDate, JSON civil, formatação sem converter fuso. DEC-03 define fechamento da competência e vencimento nominal posterior, com último dia válido no mês curto. Backend 20/20 com PostgreSQL confirma janeiro, fevereiro comum/bissexto, dezembro e preservação depois de alterar dias nominais do cartão. Nenhuma query adicional: campos já carregados, custo O(1) por DTO, sem migração ou escrita financeira nova.

Original D passa; UI mostra31jan/05fev, API concorda após reload. Browser nos três fusos usa mesmo instante 06fev01:30Z: São Paulo ainda 05fev (não atrasada), UTC/+14 dia 06 (atrasada), saldo parcial 100, mesma data civil. PAID real após fechamento 120 tem payable 0, botão desabilitado e status persistido no SQL. Não confundir calendário visual local da SPEC002 DEC01 com hojeProduto de backend/hábitos. Não há ajuste artificial de um dia.

**Resíduo confirmado:** `controle-financeiro-frontend/src/components/screens/cards/invoiceDetails.tsx:100` compara com new Date apenas ao renderizar, sem consumir atualização do calendário. Em São Paulo, manter fatura de janeiro com dueDate 05/02 e saldo 120 aberta em 05/02/2027 23:59:59; avançar para06/02 00:00 e emitir foco da janela. Esperado: competência janeiro e datas estáveis, ação passa a Pagar Atrasada. Observado: Adiantar Fatura permanece mesmo após processamento do foco e janela de assertion 15s. Prova: browser-extra/midnight.json/png e playwright.log (vermelho). SPEC002 DEC01 exige revalidação ao primeiro processamento/foco; testes do executor montavam um novo componente em cada horário e não cobriam a aba aberta.

Impacto: atraso visual fica desatualizado até outro render; nenhum débito incorreto demonstrado. Severidade residualP2, distinta do deslocamento de datas P1 já corrigido. Encerrar RF15-04 após vincular ao calendário compartilhado sem timer por cartão, manter competência selecionada, testar virada/foco com aba aberta em fusos divergentes. CF013/015 responsáveis pelo resíduo; CF005–009 não reabertas integralmente.

## Resíduo CF014 — Escape/semântica nos detalhes de metas e hábitos (P2)

Mantém a identificação descritiva do encaminhamento, agrupando a ausência do mecanismo de diálogo nesses dois consumidores. Locais: `controle-financeiro-frontend/src/components/screens/goals/goalDetails.tsx:254` e `controle-financeiro-frontend/src/components/screens/habits/habitDetails.tsx:80`.

Meta monetária 1000, checklist 10 itens 100, abrir/rolar último item/Escape: detalhe permanece, zero role=dialog, focoBODY. Hábito diário com descrição 204 caracteres, abrir por Enter, Escape: form permanece, zero role=dialog. Browser-directed/matrix-goal-detail.json (heading 2), matrix-habit-detail.json (form 1) e capturas. Os probes exploratórios passam porque registram observações, não porque Escape correto foi exigido.

Contrato AC-UI-001: operação por teclado, contenção, fechamento e retorno. Impacto: Escape não encerra a camada e navegação assistiva não reconhece diálogo. Encerrar ambos com integração do mecanismo de diálogo, mantendo edição/descarte e ações financeiras; teste real de nome, foco, Tab/Escape/retorno em formulário longo. Não duplicar RF15-01 (criação) nem RF15-03 (extrato), que estão encerrados nos respectivos recortes.

## Resíduo CF014 — destino de foco ao sair da operação de investimento (P2)

Local: `controle-financeiro-frontend/src/screens/private/investments/investmentsScreen.tsx:135`. AtivoOTHER,8 compras1×10, abrir histórico, focar Aportar/Enter, focar Confirmar Operação, Escape. Esperado: retorno a um acionador persistente/contexto equivalente; observado: ação Aportar desmontada junto do detalhe, operação fecha, focoBODY, histórico ausente. Probe vermelho e JSON em browser-directed/matrix-investment-detail.json; histórico 8 e modal inspecionados.

A assertion existente espera Aportar, mas esse nó já não existe: o requisito é destino útil e estável, não focar nó desconectado. Encerrar definindo retorno ao detalhe restaurado ou acionador persistente da lista, com teste browser. Não alterar hook global para adivinhar destino de um fluxo que substitui camadas. Nenhuma nova operação financeira foi submetida no modal dessa prova.

## Zoom — verificação faltante, não defeito

Conferidos ZOOM.md e logs/ready.json do executor: Chromium 153 localizado mas seleção recusada por inconsistência de proprietário; Chrome 154 alternativo foi bloqueado pela ferramenta por não determinar URL com confiança. Nenhum input 200 nem confirmação. Nesta sessão a alternativa cua_repl continua declarando APIs nativas desabilitadas; API browser documentada não oferece zoom nativo. Não há nova capacidade suportada demonstrada que justifique repetir/contornar bloqueio. Limite permanece CF010/015; viewport/DPR/CSS não foram aceitos como substituto.

## RVA-03 — investigação inconclusiva preservada

Conferidos RVA-03.md, rva-summary e logs do saneamento: sequência 20→120,1POST por caso, HTTP200, SQL débito 20/120 e saldo 980/880, diálogo fecha e releitura 100/0, etapas de refund/reload passam. Relógios runner e performance da UI não são subtraídos entre si. Isso não determina causa da ocorrência original pós-commit com spinner; a cópia que falhou antes do clique/semPOST não demonstra a mesma causa. Não foi repetida a sequência nesta revisão, pois não há hipótese nova a discriminar.

Garantia ainda não demonstrada: recuperação da UI no estado intermitente original depois do commit 120. Donos CF013 e investigação CF019/024; efeito no aceite apenas recuperação pós-pagamento/CF015, sem bloquear auth, extrato ou outras telas por associação. Próximo experimento somente quando sintoma reaparecer: observar montagem/cleanup do diálogo, início/fim de refresh e recibo da mesma operação, correlacionando request original; uma sequência, sem reenvio ou nova identidade para esconder resultado desconhecido. R03/RV01 continuam encerrados.
