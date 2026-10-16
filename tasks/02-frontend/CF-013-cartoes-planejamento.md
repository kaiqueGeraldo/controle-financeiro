# CF-013 — Auditar e corrigir cartões, faturas e planejamento

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Parecer independente vigente — 13/10/2026

Estado `em_revisao`: RF15-04 encerrado, com virada do dia, foco e visibilidade separados, competência preservada e cleanup. Demais aceites de lista longa/valores/status real mantidos. Resta RVA-03, investigação inconclusiva da recuperação após commit, sem nova hipótese ou novos pagamentos.

[Parecer, critérios completos, provas e encaminhamento restrito](../evidencias/revalidacao-residual-RF15/README.md). Supera os estados correntes das notas anteriores; preserva seu alcance histórico. Produto não alterado nesta revisão.

## Revalidação independente anterior — 12/10/2026

Estado `em_revisao`: datas civis persistidas/DEC-03, fusos, parcial e PAID real/reload aprovados. RF15-04 permanece aberto somente pelo atraso desatualizado com fatura aberta atravessando meia-noite/foco. Três expectativas antigas corrigidas em teste com contraprova; seleção ampla115/115. RVA-03 continua causalmente inconclusivo, sem repetir pagamento sem hipótese nova.

[Parecer, matriz, achados, testes contestados e evidências](../evidencias/revalidacao-RF15/README.md). Supera o estado corrente descrito nas notas anteriores, preservando seu alcance histórico. Sem correção de produto nesta revisão.

## Parecer dirigido anterior — 11/10/2026

Estado `em_revisao`: RF15-04 (P1) confirma datas e indicação de atraso divergentes da API/DEC-03 no detalhe da fatura. Lista longa/mobile/aninhamento e sequência20→120 executados. RVA-03 segue causalmente inconclusivo; falta prova visual específica PAID, pois adiantamento integral permanece OPEN. R03/RV01 e ownership continuam encerrados.

[Parecer, matriz por critério, achados, execuções e imagens inspecionadas](../evidencias/fechamento-CF-010-CF-015/README.md). Esta nota supera descrições correntes anteriores; relatórios datados conservam seu alcance histórico. Nenhuma correção de produto nesta revisão.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 4 e 3: falta consolidar estados de fatura vazia/aberta/paga/parcial, competência/reload, lista longa/mobile e zoom; RVA-03 pagamento120 permanece investigação CF-019/024. R03/RV01/R05/R06/R08 não são reabertos por associação. Encerrar exige matriz por critério e classificação causal da ressalva aplicável.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

R03/RV01/R05/R06/R08 continuam encerrados nos cenários revisados. A pendência posterior
RVA-03/CF-019 é interação120 sem saída visível após confirmação, com causa inconclusiva;
não é prova de duplicidade financeira nem reabertura automática de R03. Estado
`em_revisao` mantido: confrontar a matriz própria de estados/mobile/reload com evidências
posteriores, completar lacunas e preservar zoom compartilhado. A CF-024 já concluiu seu
recorte backend, sem certificar esta interação integral.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Faturas e planejamento reúnem datas, competências e status que podem divergir visualmente. Validar a navegação e apresentação sem redefinir fechamento bancário.

## Escopo e referências

- `controle-financeiro-frontend/src/screens/private/cards/`
- `controle-financeiro-frontend/src/screens/private/planning/`
- `controle-financeiro-frontend/src/components/screens/cards/`
- `controle-financeiro-frontend/src/components/screens/planning/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Cobrir fatura vazia/aberta/paga/parcial, lista longa, troca de cartão/mês e formulário de pagamento.
2. Comparar vencimento/fechamento/status entre resumo e detalhe; usar dados conhecidos para esperado visual.
3. Corrigir truncamentos, área de clique, estados de botão e erro; registrar dúvidas monetárias para CF-019.

## Aceite e testes adversariais

- [x] Mesma competência permanece selecionada e datas não recuam; status após operação é confirmado pela API/reload.
- [x] Valores extensos e lista longa não escondem ação de pagamento em mobile.
- [ ] Falha ou conflito conserva estado recuperável; snapshot é inspecionado e ligado ao defeito.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Alterar algoritmo de fatura ou duplicar dívida no frontend para alinhar uma label.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Implementada em 13/09/2026 sobre `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, preservando todas as alterações locais preexistentes. O cartão é acionável por teclado, o detalhe de fatura é um diálogo nomeado e tipado, e o pagamento aguarda a releitura antes de fechar; falhas de resultado desconhecido preservam os dados e orientam reconciliação. A validação de componente, typecheck e lint focal foram aprovadas; a mutação que remove o `await` falhou pelo fechamento prematuro e foi restaurada. [Evidência completa, comandos e limites](../evidencias/CF-013/README.md).

Estado em revisão, não concluído: faltam captura visual em navegador e E2E BFF→Spring→PostgreSQL com reload. O build local ficou bloqueado apenas pelo download de fontes Geist em `fonts.googleapis.com`; o aviso de `middleware` depreciado é preexistente. O usuário confirmou a finalização das tarefas anteriores, mas CF-005 e CF-008 ainda registram `em_revisao`, divergência documental mantida como limitação. CF-019 continua dona de algoritmo bancário e da representação de pagamento parcial; este lote não mudou esses cálculos.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R03: pagamento fecha sem reconciliar após 503; R05: erro de leitura vira vazio; R06: POST de planejamento aceita categoria alheia e persiste; R08/R10: foco/layout. O PUT de planejamento saneado foi revalidado; isso não aprova criação ou pagamento.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R03 distingue recusa, confirmação com releitura pendente e resultado desconhecido; recovery não repete POST. A proteção backend contra fechamento repetido/concorrente é localizada e não encerra CF-024. R05 explicita indisponibilidade; R06 protege categorias em todos os writers investigados; R08/R10 tratam foco e geometria.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R05/R06/R08 revalidados. Pagamento sequencial e jornada BFF/Spring/PostgreSQL/reload aprovados, mas R03 permanece aberto por RV01: sobreposição de refresh absorve falha e fecha modal. Corrigir esse bloqueio; idempotência durável CF-024 não foi encerrada. Estado em_revisao mantido.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).

## Correção dirigida R03/RV01 — 21/09/2026

Reconciliação substituída não resolve como sucesso: o modal conserva confirmação
financeira e atualização pendente, com recuperação por leitura sem reenviar.
O teste intacto do revisor falhou antes e passou depois da correção. Candidato
aguarda confirmação independente; estado em_revisao mantido, sem reabrir R05/R06/R08
ou alterar regras backend/CF-024:
[rodada, cenários e limites](../evidencias/saneamento-CF-015-RV01/README.md).

## Confirmação independente de R03/RV01 — 21/09/2026

R03/RV01 encerrado no intervalo f550b9e..e4079a9. Teste original preservado e
capaz de detectar o defeito; reconciliação substituída não fecha como sucesso.
41 componentes, nove E2E e SQL/Excel aprovados, com recuperação sem novo POST.
R05/R06/R08 e limites anteriores preservados; esta revisão não conclui toda
CF-013 nem idempotência durável CF-024. Estado em_revisao mantido.
[Parecer dirigido](../evidencias/revalidacao-CF-015-RV01/README.md).


## Candidato de saneamento RF15 — 11/10/2026

RF15-04 corrigido localmente: datas civis persistidas de fechamento/vencimento e atraso condicionado ao saldo pagável. Backend20 testes e provas em três fusos; PAID real capturado. Três assertions históricas conflitantes com DEC-03 foram preservadas e continuam vermelhas. RVA-03 teve uma sequência passiva20→120, continua inconclusivo causalmente. Estado em_revisao.

[Relatório do executor, matriz, provas e encaminhamento](../evidencias/saneamento-RF15/README.md).

## Saneamento residual do executor — 12/10/2026

Resíduos do parecer cdf0060 tratados localmente: RF15-02 (ocultação imediata), RF15-04 (reatividade do dia local) e detalhes/retorno de foco CF014. Provas originais preservadas; RF15-01/RF15-03 mantêm aceites anteriores. Este registro não concede aprovação: CF010/012/013/014/015 continuam em_revisao e CF011 concluída. Zoom nativo pendente e RVA-03 inconclusivo, sem novos experimentos por ausência de condição técnica/hipótese nova.

[Relatório, matriz residual, capturas e encaminhamento](../evidencias/saneamento-residual-RF15/README.md).

## Investigação dirigida RVA-03 — 15/10/2026

Estado `em_revisao` preservado, aguardando avaliação independente. Reprodução
causal em base8a83c35: pagamento120/recibo/débito únicos confirmados, React já
fechado/sem loading, mas AnimatePresence conserva DOM/spinner porque o clock do
harness desloca startTime para o futuro da timeline nativa. Controle Date-only
preserva data/competência e remove o sintoma; correção somente do cenário de teste.
Original histórico não tinha Fiber/WAAPI instrumentados: atribuição fortemente
sustentada, sem alegar medição retroativa. Matriz4 e jornada original2 verificadas;
sem alteração de produto ou publicação da investigação. Aceites R03/RV01/RV24 e
pendências alheias preservados. [Diagnóstico, provas e limites](../evidencias/investigacao-CF019-RVA03/README.md).

CF-013 mantém aberto o critério de estado recuperável/snapshot até revisão deste diagnóstico; demais critérios não reabertos.
