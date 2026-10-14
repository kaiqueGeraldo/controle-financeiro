# Matriz de revalidação e critérios

| Critério/risco | Evidência independente | Decisão |
|---|---|---|
| A responde depois de B aberta | rf15-review-lifecycle intacto no lote219 + jornada original resposta tardia, um POST/refresh/envelope resolvido e sem onClose obsoleto | P2 encerrado |
| A→B→A e reabertura | Casos rvr24-visual-instance + ABA real e late-recovery real | Nova instância distinta, mesmo ID não reativa a execução antiga |
| Sucesso/erro/finally e execução ativa | 19 complementos, avaliação B pendente e reconciliação A com nova intenção B | Rascunho/loading/UUID de B preservados; B ativo ainda confirma |
| Unknown/retry/recuperação | Complementos recover/retry, testes RV24 de recibo inválido e identidade, browser lost/late-recovery | UUID/payload mantidos, GET valida recibo, um efeito por fixture; retry em componente não é nova certificação backend de idempotência |
| Owner/session/unmount | Complementos e regressões RV24, probe StrictMode/cleanup | Callbacks antigos suprimidos; listeners removidos; envelope recuperável preservado |
| Refetch, seleção/foco/detalhe | Probe mesmo ID, RF15 residual investimento, regressões cf015; browser confirmado/perdido/histórico e complemento de interação | Dados globais atualizam sem fechar B; Escape devolve Aportar; sem regressão demonstrada |
| Pintura/interação | Imagens ABA/lost/late-recovery inspecionadas; interaction-preserved + interaction.json | Formulário B efetivamente pintado/usável no caminho dirigido; capturas vazias não certificadas |
| Histórico invisível | Ocorrência anterior preservada; capturas originais desta rodada ainda com região sem pintura, embora histórico original passe | Investigação inconclusiva separada, não resolvida pelo P2 |
| Dois timeouts | Lote amplo candidato219/219 e análise de código/isolation/cleanup | Causa histórica inconclusiva, não essencial ao encerramento deste P2 |

## CF-014 — todos os critérios próprios

1. Meta concluída/vencendo hoje, erro versus gráfico vazio: aceites anteriores conservados; componente goals-investments-habits-annual-audit integra a seleção ampla aprovada. Sem mudança de produto nesses módulos.
2. Calendário/histórico preservam datas; modais longos operáveis: aceites temporais e Escape anteriores preservados; ciclo visual agora encerrado, operação mobile/histórico original passam. **Permanece em aberto somente a ocorrência de conteúdo histórico não pintado**, cuja causa e limite operacional não estão demonstrados. Uma repetição verde não explica os15s de opacity0 registrados anteriormente. Não se usa o saldo correto no banco como aceite visual do histórico.
3. Nota anual após reload e posição de ano passado encaminhada à CF021: aceites anteriores preservados, nenhuma mudança nesses caminhos.
4. Evidências, limites e testes não enfraquecidos: atendido, incluindo falhas de ambiente e imagens insuficientes.

CF014 permanece em_revisao pelo item2, sem reabrir outros critérios ou transferir RJ-022-01/H24-01 por associação. Nenhum critério removido.

## CF-015 — efeito no marco

Critérios originais de decisão explícita sobre P0/P1, sensibilidade dos testes, distinção funcional/visual e registro de limitações preservados. O P2 não é mais obstáculo; zoom nativo200 não executado (CF010/015), RVA-03 inconclusivo após commit (CF013/015) e histórico invisível (CF014/015) permanecem. Não conceder aceite integral pela prova financeira ou por checkboxes documentais. CF011/012 não são afetadas por essas pendências específicas.
