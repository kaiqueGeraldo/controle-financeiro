# CF-015 — Revisar independentemente o marco de datas e frontend

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-007](../01-datas-integracao/CF-007-e2e-temporal.md), [CF-009](../01-datas-integracao/CF-009-estado-assincrono.md), [CF-011](../02-frontend/CF-011-auth-configuracoes.md), [CF-012](../02-frontend/CF-012-dashboard-contas-extrato.md), [CF-013](../02-frontend/CF-013-cartoes-planejamento.md), [CF-014](../02-frontend/CF-014-metas-investimentos-habitos-resumo.md)
- Origem: T-008, T-010; F-001–007, F-015

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

- [ ] Nenhum P0/P1 do marco fica sem correção ou decisão explícita que impeça alegar conclusão.
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
