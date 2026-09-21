# CF-012 — Auditar e corrigir dashboard, contas e extrato

- Estado: em_revisao
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

- [ ] Datas de lista/detalhe concordam; moeda/privacidade não cortam ou revelam valores indevidamente (validação visual autenticada pendente).
- [x] Erro de API não aparece como saldo zero ou lista vazia legítima; retry funciona.
- [x] Filtro/página não altera indevidamente a interpretação do total; divergência de cálculo tem achado separado (F-018 → CF-021).
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Recalcular saldo financeiro no componente para compensar erro de backend.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Implementação concluída e em revisão em 13/09/2026 sobre `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, preservando o patch local preexistente. Foram corrigidos os estados que convertiam falha de API em totais/listas vazios, com retry verificável, e os consumers de data civil restantes nas telas auditadas. A paginação revelou o achado **F-018**, encaminhado a CF-021 sem inventar agregado financeiro no componente. [Evidência completa, mutação, comandos e limitações](../evidencias/CF-012/README.md).

Validação local: 95/95 testes de componente, typecheck, lint direcionado e `git diff --check` aprovados. O build de produção foi tentado, mas o host não alcançou Google Fonts; navegador autenticado com backend descartável não estava disponível. Esses limites e a revisão independente de CF-015 permanecem explícitos.

O fechamento depende de validação visual autenticada em navegador; CF-015 não deve consumir CF-012 como concluída até esse roteiro. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R02 reproduz gráfico do período abandonado; R10 confirma problemas de geometria no tablet e R12 identifica ação mobile sem nome acessível. F-018 permanece aberto quanto ao escopo do total do extrato.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R02: gráfico ignora respostas obsoletas, inclusive após cache hit. R10 ajusta grades/controles/valores; R12 nomeia a ação mobile. Dashboard e contas participam da releitura após pagamento e apresentam falha quando não atualizados.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.
