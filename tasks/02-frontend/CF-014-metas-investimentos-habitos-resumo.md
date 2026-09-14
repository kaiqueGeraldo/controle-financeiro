# CF-014 — Auditar metas, investimentos, hábitos e resumo anual

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Problema e resultado esperado

As telas restantes combinam histórico, progresso, gráficos e formulários grandes. A auditoria deve separar erro de apresentação de erro financeiro.

## Escopo e referências

- `controle-financeiro-frontend/src/screens/private/goals/`
- `controle-financeiro-frontend/src/screens/private/investments/`
- `controle-financeiro-frontend/src/screens/private/habits/`
- `controle-financeiro-frontend/src/screens/private/annual-summary/`
- `controle-financeiro-frontend/src/components/screens/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Aplicar matriz por tela: metas monetária/numérica/checklist; ativo sem/com histórico; hábito diário/semanal; ano sem dados.
2. Comparar lista/detalhe, prazo, escala de progresso, tooltip/gráfico e notas, com texto longo e valores extremos admitidos.
3. Corrigir defeitos reproduzidos por tela em alterações delimitadas; abrir tarefa derivada se o escopo se expandir.

## Aceite e testes adversariais

- [ ] Meta concluída e vencendo hoje apresentam status esperado; gráfico vazio não representa erro como ausência de patrimônio.
- [ ] Calendário de hábito e histórico preservam data; modais longos continuam operáveis.
- [ ] Nota anual salva sobrevive ao reload; posição atual exibida em ano passado é encaminhada a CF-021, sem snapshot legitimando ambiguidade.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Novos módulos de vida, redesign completo ou mudança de cálculo de ativos/metas.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-014/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R01/R04 reproduzem ano obsoleto e rascunho exibido como salvo sem persistir. P05 revalidado nos três fusos; posição histórica indisponível não encerra os defeitos de estado/nota.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.
