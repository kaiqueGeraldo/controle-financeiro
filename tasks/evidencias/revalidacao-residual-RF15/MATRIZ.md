# Matriz independente

Provas originais: [revalidação anterior](../revalidacao-RF15/README.md) e [saneamento candidato](../saneamento-residual-RF15/README.md). Cinco reproduções originais executadas sem enfraquecer expectativas. Caminhos abaixo relativos ao frontend.

| Critério | Causa/arquivos do candidato | Verificação independente | Resultado e pendência |
|---|---|---|---|
| A. RF15-02 | `src/components/ui/privacyBlur.tsx`: visibility hidden e aria-hidden imediatos, sem transição expondo valor | Prova original de frames da montagem animada, ativo/arquivado, negativo/extenso, claro/escuro, reload/off; suplemento de troca de conteúdo e ativação durante transição controlada | Encerrado. Sem promessa de sigilo de rede; suplemento WAAPI não substitui a prova original Framer sem reduced motion |
| B. RF15-04 | `src/app/(private)/cartoes/page.tsx`, `cardsScreen.tsx`, `invoiceDetails.tsx`: propaga dia compartilhado | Meia-noite original; foco e visibilitychange separados em SP/UTC/Kiritimati; timer/cleanup, saldo 0/parcial100, seleção janeiro preservada, 31jan/5fev, sem GET extra | Encerrado. DEC-01/03 mantidas; PAID real e regras backend reutilizados, sem offset fixo ou duplicação de listeners |
| C. CF014 metas/hábitos | `goalDetails.tsx`, `goalItem.tsx`, `habitDetails.tsx`: integração com hook, edição antes de fechamento, semântica/teclado | Duas reproduções originais; conteúdo longo, Tab/Escape, rascunho restaurado, Escape rápido, camada de exclusão da meta, scroll/body cleanup e retorno | Resíduos originais encerrados. Hook compartilhado não mudou; RF15-03 preservado e regressão dirigida aprovada |
| D. CF014 investimento | `investmentDetails.tsx`, `investmentItem.tsx`, `investmentsScreen.tsx`: seleção mantida em loading/erro, não limpa ao operar | Original passou isolado: oito movimentos, Escape operação→Aportar→lista; real confirmado e resposta perdida/reconciliação sem reenviar, reload/recibo/SQL; A fechada→B aberta→resposta A | Retorno original encerrado. Novo P2 visual A→B confirmado; ocorrência opacity0 inicial inconclusiva |
| E. Editar hábito | `habitDetails.tsx`: identidade das ações edit/save, ref de edição, guardas | Mouse e teclado sem PUT ao editar/cancelar; salvar legitimamente gera exatamente um PUT e persiste no reload | Resíduo encerrado. Não conclui RJ-022-01/H24-01 ou validação histórica de descrição extensa |
| F. Zoom | Sem alteração pertinente | Registro `../saneamento-RF15/ZOOM.md` confrontado com capacidade atual; API nativa continua indisponível | Verificação não executada: 200% nativo, alcance das ações, sobreposição/reflow CF010/015. Viewport/CSS/DPR não substituem |
| G. RVA-03 | Sem hipótese nova pertinente | Registro `../saneamento-RF15/RVA-03.md` e aceites prévios reutilizados | Investigação inconclusiva, nenhum novo pagamento; falha anterior ao envio e reconciliação após commit permanecem distintos |

## Critérios completos das tarefas

CF-010: geometria 360px/teclado e claro/escuro, foco/retorno/scroll compartilhados e registro de evidências têm aceites anteriores complementados nesta rodada; falta a parcela zoom nativo do primeiro critério. O novo defeito é do consumidor de operação em CF014, não regressão demonstrada do hook comum.

CF-012: (1) datas lista/detalhe, moeda negativa/extensa e privacidade completos com RF15-02/03; (2) erro não convertido em zero e retry aceitos anteriormente, regressões passam; (3) filtro/página/total global F-018→CF021 já aceito, lista100/reload preservados; (4) evidências/limites registrados, assertions originais intactas. Nenhum critério próprio depende do resultado desconhecido de pagamento RVA-03. Concluir.

CF-013: (1) competência/datas/status API/reload aceitos com RF15-04 e provas reais anteriores; (2) valores extensos/lista longa/ação mobile aceitos anteriormente; (3) recuperação de falha/conflito ainda conserva RVA-03 inconclusivo; (4) evidências/limites satisfeitos. Manter em revisão apenas pelo recorte não resolvido.

CF-014: (1) status de meta hoje/concluída e erro versus patrimônio vazio aceitos anteriormente; (2) datas de calendário/histórico e operação dos modais longos têm avanço, mas ciclo A→B falha e opacidade do histórico não tem causa demonstrada; (3) nota anual persistente e ambiguidade de posição passada encaminhada a CF021 conservam aceites anteriores; (4) evidências/limites satisfeitos. Não transformar fechamento dos sintomas originais em conclusão da tarefa.

CF-015: decisão explícita sobre P0/P1, testes sensíveis, distinção funcional/visual e registro de limitações conservados. A revisão original exige avaliar o marco: checkboxes documentais já marcados não eliminam zoom, RVA-03 ou P2 CF014. Sem aprovação global por associação.
