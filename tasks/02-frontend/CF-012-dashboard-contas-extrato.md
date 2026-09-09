# CF-012 — Auditar e corrigir dashboard, contas e extrato

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Problema e resultado esperado

Principais visões do dia a dia devem exibir datas, moeda e estados coerentes, incluindo muitos registros e falha de carregamento.

## Escopo e referências

- `controle-financeiro-frontend/src/screens/private/dashboard/`
- `controle-financeiro-frontend/src/screens/private/accounts/`
- `controle-financeiro-frontend/src/screens/private/extract/`
- `controle-financeiro-frontend/src/components/screens/dashboard/`
- `controle-financeiro-frontend/src/components/screens/accounts/`
- `controle-financeiro-frontend/src/components/screens/extract/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Auditar vazio/loading/erro, saldo negativo, nomes longos, filtros, paginação, agrupamento e detalhes.
2. Corrigir layout/apresentação e navegação; se o valor recebido estiver errado, abrir achado ligado à tarefa financeira sem alterar expected.
3. Adicionar regressões de componente e roteiro funcional por viewport; validar persistência de operação representativa quando backend disponível.

## Aceite e testes adversariais

- [ ] Datas de lista/detalhe concordam; moeda/privacidade não cortam ou revelam valores indevidamente.
- [ ] Erro de API não aparece como saldo zero ou lista vazia legítima; retry funciona.
- [ ] Filtro/página não altera indevidamente a interpretação do total; divergência de cálculo tem achado separado.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Recalcular saldo financeiro no componente para compensar erro de backend.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-012/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

