# CF-015 — Revisar independentemente o marco de datas e frontend

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-007](../01-datas-integracao/CF-007-e2e-temporal.md), [CF-009](../01-datas-integracao/CF-009-estado-assincrono.md), [CF-011](../02-frontend/CF-011-auth-configuracoes.md), [CF-012](../02-frontend/CF-012-dashboard-contas-extrato.md), [CF-013](../02-frontend/CF-013-cartoes-planejamento.md), [CF-014](../02-frontend/CF-014-metas-investimentos-habitos-resumo.md)
- Origem: T-008, T-010; F-001–007, F-015

## Parecer independente vigente — RVA-03, 16/10/2026

Decisão posterior de21/10/2026: [DEC-ONB-03](../../docs/sdd/decisoes/003-liberacao-local-CF-031.md)
autoriza desenvolvimento/revisão locais CF-031 pelos aceites existentes.
CF-015 continua em_revisao; zoom nativo200% não foi aprovado nem convertido em
defeito. Escopo, procedimento, evidência, limitação, momento e responsáveis da
pendência estão na decisão. Reavaliar com onboarding antes da liberação para uso.
Pareceres históricos e gates de CF-032/adoção real/deploy preservados.

**CF-015 permanece em_revisao pela verificação faltante de zoom nativo200%.**
RVA-03 encerrada com ressalva histórica explícita; CF019/013 concluídas após
confronto de todos os critérios. CF011/012/014 e demais aceites preservados.
Não encerra outros timeouts/falhas de pintura por associação, nem certifica
adoção real CF017/P01/P02, onboarding ou publicação.

[Parecer A–E, matriz integral, limites e próximo trabalho](../evidencias/revalidacao-CF019-RVA03/README.md).
Próximo trabalho do marco: prova real de zoom200%, reflow e alcance das ações;
viewport/DPR/capturas atuais não substituem. Notas abaixo são históricas.

## Parecer independente anterior — histórico CF014, 14/10/2026

**CF-015 permanece em_revisao.** CF014 concluída após validação independente
do diagnóstico temporal/harness e confronto dos quatro critérios acumulados.
Histórico invisível e P2 ciclo visual encerrados no escopo demonstrado.
Restam zoom nativo200% não verificado (CF010) e RVA-03 inconclusivo (CF013).
CF011/012 e RF15-01–04 preservados; outras capturas e timeouts históricos não
explicados por associação. Sem aprovação integral do marco ou onboarding.

[Parecer A–E, matriz vigente, provas e encaminhamento delimitado](../evidencias/revalidacao-CF014-historico-invisivel/README.md).

## Parecer anterior — ciclo visual e candidato de harness, 14/10/2026

Diagnóstico dirigido posterior do executor sobre o histórico CF014 identifica
divergência de origem temporal do harness/WAAPI e prepara ajuste apenas de
teste; produto e aceites anteriores preservados. Aguarda decisão independente
sobre o recorte e seu critério acumulado; CF015 continua `em_revisao`, sem
liberação automática, investigação de RVA-03, zoom ou timeouts nesta rodada.
[Provas e condições de encerramento](../evidencias/investigacao-CF014-historico-invisivel/README.md).

O achado **P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)** está encerrado, sem aprovar o marco por associação. Estado `em_revisao`: zoom nativo200 não verificado, RVA-03 inconclusivo e histórico invisível CF014 continuam pendências específicas. Dois timeouts históricos seguem causalmente inconclusivos, sem impedir o aceite deste P2: seleção ampla independente219/219 e cleanup dirigido aprovados. CF011/012 e RF15-01–04 preservados.

[Modelo de identidade, matriz, interface/SQL, timeouts e resultados](../evidencias/revalidacao-RVR24-02-ciclo-visual/README.md). Base cbbf58d..0f9beb1; esta decisão supera as notas anteriores somente no recorte examinado. Nenhuma correção de produto nesta revisão.

## Candidato do executor — ciclo visual, 13/10/2026

Saneamento delimitado do P2 de CF014 (vínculo RVR24-02), base cbbf58d, preparado para o mesmo revisor. Não concede aceite do marco: CF014/015 seguem em_revisao; CF011/012 e RF15-01/02/03/04 preservados. Zoom, RVA-03 e ocorrência de histórico invisível não encerrados por associação. Sem onboarding ou tarefas posteriores.

[Causa, identidades, provas e encaminhamento](../evidencias/saneamento-RVR24-02-ciclo-visual/README.md).

## Parecer independente anterior — 13/10/2026

Estado `em_revisao`: RF15-02/04 e resíduos originais CF014 encerrados; CF012 concluída e CF011 preservada. Faltam zoom nativo, investigação RVA-03 e resíduo CF014 (P2 de ciclo visual A→B, mais ocorrência de opacidade inconclusiva). Não restam somente verificações faltantes; há defeito confirmado. Critérios originais do marco preservados.

[Parecer, critérios completos, provas e encaminhamento restrito](../evidencias/revalidacao-residual-RF15/README.md). Supera os estados correntes das notas anteriores; preserva seu alcance histórico. Produto não alterado nesta revisão.

## Revalidação independente anterior — 12/10/2026

Estado `em_revisao`: RF15-01/03 encerrados; RF15-02/04 parcialmente saneados com resíduos reproduzidos; resíduos CF014, zoom e RVA-03 delimitados. Nenhuma nova tarefa integralmente concluída; CF011 permanece concluída. Aceites CF005–009/RV24/CF025–028 preservados, sem veto automático de CF017 nem início de onboarding.

[Parecer, matriz, achados, testes contestados e evidências](../evidencias/revalidacao-RF15/README.md). Supera o estado corrente descrito nas notas anteriores, preservando seu alcance histórico. Sem correção de produto nesta revisão.

## Parecer dirigido anterior — 11/10/2026

Estado `em_revisao`: CF-011 concluída; CF-010/012/013/014 conservam impedimentos específicos. RF15-02/04 P1 e RF15-01/03 P2, zoom nativo sem prova e demais lacunas/investigações impedem aprovação do marco. R03/RV01, RV24-01/02, CF-005–009 e CF-025–027 conservam aceites. CF-017 não é bloqueio automático da revisão local. CF-028 segue exclusivamente especificação.

[Parecer, matriz por critério, achados, execuções e imagens inspecionadas](../evidencias/fechamento-CF-010-CF-015/README.md). Esta nota supera descrições correntes anteriores; relatórios datados conservam seu alcance histórico. Nenhuma correção de produto nesta revisão.

## Atualização das dependências — 08/10/2026

A [revisão dirigida CF-005–008](../evidencias/revisao-dirigida-CF-005-CF-008/README.md)
conclui CF-007/008 localmente. CF-009/RV24-01 e CF-025–027 já possuem aceites
posteriores às notas abaixo. CF-005/006 têm pendências locais RD58-01/02,
com vínculo aos consumidores de resumo anual/histórico de metas da CF-014.
Estado do marco permanece `em_revisao`; não foi executado seu fechamento nem
reavaliado zoom, pagamento120 ou as investigações de hábitos/scheduler.
Aceites por tela e gates próprios continuam exigidos, sem mudar dependências.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 4, 1, 2 e 3: marco depende de zoom real e aceites próprios CF-011–014, além dos resíduos posteriores aplicáveis RV24-01/RVA-03/RJ-022-01. Não resumir tudo a zoom nem reabrir R03/RV01. Encerrar exige parecer do marco cruzando critérios, aceites e lacunas; liberação local de CF-026 não é conclusão integral.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

Estado `em_revisao` mantido. Zoom nativo 200% continua sem prova e sem aprovação; não é
defeito demonstrado. A frase histórica de pendência exclusivamente de zoom descreve o
parecer dirigido de 21/09, não elimina os achados posteriores RV24-01, RVA-03 e RJ-022-01
nem os aceites residuais das telas. R03/RV01 permanece encerrado. A revisão residual
`e927aea..0099185` liberou explicitamente manutenção CF-026 no seu recorte. Confronto
documental em `c7f7ffc` preserva essa liberação, sem concluir o marco ou liberar
publicação.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Antes de ampliar funcionalidades, confrontar os fluxos corrigidos com regras e evidências. Revisar também se os testes conseguem detectar os defeitos, não só executar código.

## Escopo e referências

- `tasks/evidencias/`
- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`
- `docs/sdd/specs/002-datas.md`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Executar jornada financeira curta em navegador real nas combinações críticas de fuso/viewport, sem sucesso HTTP simulado.
2. Revisar captures/traces e executar casos novos, como aba aberta atravessando meia-noite, reload e resposta atrasada.
3. Em cópia isolada, reintroduzir conversão UTC indevida e atraso de hoje; verificar que testes relevantes falham e restaurar.

## Aceite e testes adversariais

- [x] Nenhum P0/P1 do marco fica sem correção ou decisão explícita que impeça alegar conclusão. R03/RV01 encerrado na revalidação dirigida de e4079a9; zoom permanece pendência separada de aceite.
- [x] Testes detectam os defeitos temporais e de estado representativos; falha não decorre só de import/ambiente.
- [x] Relatório distingue automação/funcional manual/visual e lista cenários não executados; não promete zero bugs.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Aprovar com base apenas no relatório do implementador, começar onboarding para contornar falha pendente.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Executada em 13–14/09/2026, com parecer e evidências em [revisao-CF-015](../evidencias/revisao-CF-015/README.md), conforme o caminho solicitado para esta revisão. O marco permanece sem aprovação pelos achados abertos e lacunas registradas. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

Revisão executada e parecer emitido com restrições. Marco não aprovado; achados de produto permanecem abertos. P03 (PUT), P04 e P05 revalidados no escopo dirigido; P01/P02 conservam dependência de adoção CF-017. Nenhuma publicação, banco real ou avanço para CF-016.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

Saneamento dos achados R01–R12 executado como preparação de candidato. O relatório por achado, execuções, limites, commits e intervalo exato para revalidação estão no registro abaixo. Esta execução não é revisão independente nem aprovação do marco.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

Revalidação independente concluída com parecer não aprovador. R03 continua aberto por RV01 (P1), demonstrado por teste determinístico novo; zoom nativo 200% permanece lacuna de CF-010. Recomendação: corrigir achado bloqueante e completar zoom antes de reapresentar. CF-015 permanece em_revisao; CF-016 não iniciada. CF-017/P01/P02 e CF-024 mantêm seus escopos/gates próprios, sem fechamento implícito nem bloqueio automático de interface independente.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).

## Rodada dirigida R03/RV01 e R10 — 21/09/2026

Sobre a base f550b9e, a reconciliação substituída passa a rejeitar explicitamente
para seu chamador; não autoriza fechamento do pagamento. Teste original do
revisor reproduzido vermelho antes da edição e aprovado sem alteração depois.
Sobreposições, respostas antigas e recuperação sem POST adicional cobertas.
R03/RV01 corrigido pelo executor, aguardando confirmação independente.

Zoom nativo 200% continua **pendente**: a ferramenta recusou acessar a janela
de teste mesmo após renovar sua seleção. Nenhuma evidência de viewport foi
promovida a prova de zoom. Tentativas, roteiro manual e intervalo de revisão:
[rodada dirigida](../evidencias/saneamento-CF-015-RV01/README.md).

CF-015 permanece em_revisao; pronta para confirmação independente da correção,
sem aprovação integral do marco. CF-016 não iniciada; achados já encerrados
preservam os limites do parecer anterior. README raiz e relatórios preservados.

## Parecer dirigido R03/RV01 — 21/09/2026

R03/RV01 encerrado por revalidação independente de f550b9e..e4079a9, preservando
os encerramentos anteriores. Zoom nativo 200% continua sem evidência e sem
aprovação; CF-015 permanece em_revisao por esse aceite pendente de CF-010.

A pendência não impede iniciar a especificação CF-016 por suas dependências
reais: CF-001 e CF-004 estão concluídas/integradas, e o guia permite antecipar
especificação financeira. Isso não equivale à aprovação integral do marco ou
publicação. CF-016 não foi iniciada nem teve seu estado alterado nesta revisão.
[Conclusões separadas, comandos e evidências](../evidencias/revalidacao-CF-015-RV01/README.md).


## Candidato de saneamento RF15 — 11/10/2026

Candidato de saneamento RF15-01–04 preparado com provas anteriores/posteriores e hashes independentes preservados. Não houve autoaprovação. CF-011 continua concluída; CF-010/012/013/014/015 em_revisao. Zoom nativo pendente, RVA-03 inconclusivo, conflitos das provas antigas de datas e resíduos próprios da matriz CF-014 explicitados. Sem onboarding, tarefas posteriores, push, deploy ou banco real.

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

CF-015 não conclui o marco: recebe diagnóstico candidato RVA-03; zoom nativo200% permanece separado. CF-014/011/012 preservam conclusão.
