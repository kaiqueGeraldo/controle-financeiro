# Candidato residual RF15 — executor, 12/10/2026

Base cdf00606bf1ebc11d37ed0de405569632f9e8b8d, branch codex/cf-028-contrato-onboarding. Saneamento limitado ao [parecer independente](../revalidacao-RF15/README.md). Não é aprovação de CF-010–015. CF010/012/013/014/015 permanecem em_revisao; CF011 concluída; RF15-01 e RF15-03 conservam seus aceites anteriores.

## Causas e decisões

| Identificação existente | Causa reproduzida | Alteração local e trade-off |
|---|---|---|
| RF15-02 residual — CF010/012 | transition-all interpolava a cor até transparente. Original intacto detectou alpha positivo com preferência persistida; aria-hidden não impede pintura. | PrivacyBlur deixa de animar a ocultação e aplica visibility:hidden no conteúdo imediatamente. Espaço e indicação “Valor oculto” permanecem; contents somente no modo normal preserva layout flex/ícones. Cores próprias de descendentes também ficam invisíveis. Perde-se o fade da cor; pulso do fundo permanece. Preferência continua useUser/PATCH/releitura, sem regra por tela, promessa de sigilo de DOM/rede ou sincronização entre abas. |
| RF15-04 residual — CF013 | Dia local só consultado durante render. Original aberto em05fev23:59:59SP continuou Adiantar depois de06fev00:00/focus. | A composição da rota consome BrowserTodayProvider e injeta referenceDay na tela/detalhe. Mesmo provedor/timer/foco/visibilidade, sem polling ou listener novo. Apresentação isolada aceita dia explícito ou default local, preservando compatibilidade e testes originais sem provedor. Datas civis persisted/DTO/DEC03, competência, saldo e coordenação de requests inalterados. Virada exige cálculo local, não releitura financeira. |
| Resíduo CF014 — Escape/semântica nos detalhes de metas e hábitos | Meta1000/checklist10 e hábito diário/descrição longa permaneceram após Escape; sem role=dialog. | Consumidores integram useDialogFocus existente: nome, foco inicial, Tab, Escape e retorno. Acionador de meta passa a ser operável/focável; privacidade impede abertura. Escape cancela primeiro o editor/formulário local, restaura dados e não fecha durante gravação. Hábito longo recebe limite de altura/scroll. Hook global não alterado. |
| Resíduo CF014 — destino de foco ao sair da operação de investimento | Selecionar Aportar desmontava detalhe/acionador. Original8compras terminou emBODY. | Detalhe permanece sob operação, integrado à mesma pilha; Escape fecha somente operação, retorna a Aportar; outro fecha detalhe e retorna à lista operável. Manter detalhe existente durante releitura evita remontá-lo sobre operação e roubar foco. Sem mudar protocolo, recibos, valores ou submissão financeira. |

Custos: ocultação e cálculo de atraso O(1) por render. Uma assinatura de calendário na composição, sem timer por cartão nem query adicional; render de tela na mudança de dia preserva seleção. Contenção de foco mantém o custo existente O(k) nos controles do diálogo. Conservar detalhe de investimento usa a árvore já carregada durante a operação; evita desmontagem, ao custo de manter esse contexto em memória. Não há benchmark nem certificação de consultas fora destes caminhos.

## Reprodução e preservação

Plano anterior à edição: [PLANO.md](PLANO.md). Estado original e README: [BASE.txt](BASE.txt). Inventário das provas independentes: [original-hashes.json](original-hashes.json), incluindo toda a última revalidação, testes de componente e probes RF15. Nenhum expected do revisor foi alterado; correções DEC03 de e4b0877 preservadas.

`browser/before`:5 falhas/1 aprovação. Falham original animação, original meia-noite, original investimento, novo Escape meta e novo Escape hábito. Passa original navegação privada/rascunho do extrato. Falhas efetivas: meta2 headings em vez de1; hábito1 formulário em vez de0; investimentoBODY; atraso ainda Adiantar; frames monetários com alpha>0. As capturas anteriores e posteriores ao Escape e JSON foram preservados. A primeira captura de animação pode ocorrer depois do frame exposto; amostras numéricas sustentam esta reprodução, e a captura claramente exposta do revisor é evidência histórica separada.

`privacy-before.log`:3/3 variantes falham com descendente de cor própria visível; a prova de componente verifica visibilidade imediata, troca de dado, desligamento e nova ativação. Browser independente preserva a animação real (no-preference); complemento controlado pausa uma transição ancestral em150/300ms, ativa preferência real, troca dados por API/releitura e inspeciona pintura/aria. Essa transição controlada não é rotulada como animação Framer original.

## Execuções intermediárias e limites de interpretação

- `after-first`: os seis casos da reprodução inicial passam. Seis casos novos param na montagem por tentar ler JSON de resposta204; helper do executor corrigido para resposta vazia. Não são falhas do produto. Caso novo de dois Escape rápidos no hábito revelou comportamento ainda incorreto; investigação registrada separadamente.
- `components-wide`:121 passam/2 falham por montagem isolada de cartões sem provedor. Composição corrigida na fronteira da rota, sem enfraquecer testes nem tornar o contexto global opcional. `components-after`:125/125 passam.
- `dialogs-intermediate`:1 falha/1 passa; prova de dois Escape antes do commit React e bloqueio durante gravação. Referência de edição síncrona no consumidor protege eventos consecutivos; não basta inferir sucesso no browser a partir de jsdom.
- `investment-intermediate`:falha demonstra desaparecimento do detalhe durante loading. `lifecycle-after`:3/3 passam após conservar a montagem, incluindo foco na camada superior durante releitura.
- `after-second`:8 passam/8 falham. Seis falhas de seletor novo com capitalização errada, embora Pagar Atrasada apareça; literal passa a corresponder a janeiro de2027. Uma captura de liberação ocorreu durante releitura da preferência/contas: nova prova aguarda o valor efetivamente visível, sem sleep nem aumento de timeout. Escape rápido continua em investigação nesta execução; `escape-diagnostic` conserva eventos e DOM. Não ocultar essas execuções nem chamá-las de retries verdes.

O diagnóstico seguinte separou duas causas no hábito. A referência síncrona protege dois eventos antes do commit React (prova de componente), mas a rede real revelou dois PUT indevidos ao clicar Editar: o mesmo nó button era reaproveitado como submit/Salvar antes da ação padrão do clique. A releitura remontava o diálogo, perdendo foco e estado. Chaves distintas para editar/salvar/cancelar/excluir impedem a reutilização de identidade. `habit-unintended-put.json` deriva do trace preservado; `escape-breakpoint` é diagnóstico com pausa, não prova de timing. O código de diagnóstico foi salvo em escape-diagnostic-source.txt e removido da prova funcional final. A assertion adicional exige zero PUT ao editar/cancelar. Nenhum código de produto foi instrumentado nem recebeu mutação de contraprova.

## Resultados finais

- `components-final.log`: 18 arquivos, 126 testes passaram; seleção pertinente preserva CF011, RF15 originais, RV24, precisão e recuperação.
- `browser/after-final/playwright.log`: 17 cenários passaram, retries0. Originais de animação, meia-noite e investimento antes vermelhos agora verdes; Escape meta/hábito também verde. `habit-writes.json`: zero PUT ao editar/cancelar.
- `investment-final.log`: repetição delimitada do cenário original de investimento após conservar detalhe também no erro de releitura; passou. `investment-error-intermediate.log` registra a falha causal anterior.
- `goal-visual-final.log`: complemento visual passou após esperar ausência observável do diálogo; captura nítida inspecionada. A captura anterior durante saída permanece com ressalva.
- `lint-final.log`: sucesso. `typecheck-final.log` detectou opção exact inválida no teste novo de investimento; seletor corrigido para regex ancorada, sem alterar critério. `typecheck-verified.log` e `investment-types-verified.log`: sucesso. `build-final.log`: sucesso; aviso existente de convenção middleware depreciada não tratado neste escopo.
- `hash-check.json`: 160/160 provas independentes intactas, README raiz com SHA256 original. Nenhuma assertion, entrada ou expected original alterado. DEC03 preservada.

[Matriz e condições de encerramento](MATRIZ.md), [inspeção visual e ressalvas](VISUAL.md), [encaminhamento e reprodução](ENCAMINHAMENTO.md). Estes resultados são do executor. RF15-02/RF15-04 e resíduos CF014 corrigidos localmente aguardam revalidação independente.

Consumidores: PrivacyBlur continua compartilhado nas superfícies financeiras existentes; cobertura combinada de componentes e contas/extrato em navegador verifica o recorte afetado. Calendário compartilhado e useDialogFocus não tiveram implementação alterada; somente composição de cartões e consumidores de diálogo mudaram. Investimento mantém última posição durante erro com alerta explícito: evita perda do contexto/foco, mas dados exibidos podem representar a última leitura válida, sem alegação de atualização bem-sucedida.

## Pendências preservadas

Zoom nativo200: verificação faltante; nenhuma capacidade nova demonstrada em relação ao parecer. Não repetir ferramentas bloqueadas nem substituir por viewport/DPR/CSS. RVA03: investigação inconclusiva de recuperação intermitente pós-commit; sem hipótese nova, nenhum pagamento repetido para buscar verde. Próximo experimento permanece o do revisor, correlacionando a mesma operação se o sintoma reaparecer. Não impede este saneamento.

Nenhuma implementação de onboarding, push, deploy, migração ou acesso a banco real. Backend de produto inalterado; harness Spring/PostgreSQL16 descartável, Flyway real, Clock produto/auth15jan2027, JVMUTC, e-mails/mercado externos falsos. Retries0. Pagamentos anteriores/PAID e regras bancárias aceitas são histórico reutilizado; nova cobertura temporal é visual, com OPEN120 no navegador e saldo100/PAID0 em componentes. Não se declara nova auditoria financeira integral.
