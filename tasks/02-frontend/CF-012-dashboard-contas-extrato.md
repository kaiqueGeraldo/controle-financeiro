# CF-012 — Auditar e corrigir dashboard, contas e extrato

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Parecer independente vigente — 13/10/2026

Estado `concluida`: RF15-02 encerrado durante a transição, além do aceite RF15-03. Datas/moeda/privacidade, erro/retry e filtro/página/total global atendem aos critérios completos com os aceites anteriores. Zoom compartilhado CF010/015 e RVA-03 CF013 não impedem esta conclusão.

[Parecer, critérios completos, provas e encaminhamento restrito](../evidencias/revalidacao-residual-RF15/README.md). Supera os estados correntes das notas anteriores; preserva seu alcance histórico. Produto não alterado nesta revisão.

## Revalidação independente anterior — 12/10/2026

Estado `em_revisao`: RF15-03 encerrado no detalhe do extrato (teclado, Escape, retorno e descarte). RF15-02 parcialmente saneado: contas arquivadas e árvore acessível protegidas no estado estável, mas resumo expõe valores durante animação inicial. Moeda negativa/extensa, reload e demais aceites anteriores preservados.

[Parecer, matriz, achados, testes contestados e evidências](../evidencias/revalidacao-RF15/README.md). Supera o estado corrente descrito nas notas anteriores, preservando seu alcance histórico. Sem correção de produto nesta revisão.

## Parecer dirigido anterior — 11/10/2026

Estado `em_revisao`: RF15-02 (P1, saldo arquivado visível no modo privacidade) e RF15-03 (P2, detalhe não fecha com Escape e não possui semântica de diálogo). Lista100/filtros/páginas/reload/saldo real aprovados; F018 e aceites temporais conservados. Limites de inspeção visual explicitados na matriz.

[Parecer, matriz por critério, achados, execuções e imagens inspecionadas](../evidencias/fechamento-CF-010-CF-015/README.md). Esta nota supera descrições correntes anteriores; relatórios datados conservam seu alcance histórico. Nenhuma correção de produto nesta revisão.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categoria 4: completar matriz autenticada de moeda/privacidade, lista/detalhe, valores extensos e estados, reutilizando capturas já inspecionadas. Zoom compartilhado continua CF-010. F-018 foi aceito na CF-021; não reimplementar agregado para obter fechamento visual. Condição: parecer por critério com lacunas visuais cobertas.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

F-018 não permanece pendente quanto ao total global/filtros: esse critério recebeu aceite
independente na consolidação CF-021 da revisão CF-022/023 (`9ff1aec`). A anotação
histórica de F-018 aberto fica superada nesse recorte. CF-012 permanece `em_revisao`:
falta fechar o aceite visual autenticado de moeda/privacidade e lacunas da matriz,
preservando zoom nativo na CF-010/015. Aceite do agregado não aprova automaticamente a
interface inteira.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

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

- [x] Datas de lista/detalhe concordam; moeda/privacidade não cortam ou revelam valores indevidamente.
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

## Revalidação independente CF-015 — 21/09/2026

R02/R12 encerrados nos cenários originais. Capturas inspecionadas mostram os recortes tratados; não foi certificada toda a matriz de privacidade. Estado em_revisao mantido; F-018/CF-021 permanece separado.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).


## Candidato de saneamento RF15 — 11/10/2026

RF15-02 e RF15-03 corrigidos localmente: saldo arquivado e exposição acessível protegidos pelo mecanismo compartilhado; detalhe do extrato integrado a teclado/Escape/foco, com moeda extensa mobile. Provas originais vermelhas antes e verdes depois, capturas e regressões anexadas. Estado em_revisao até decisão independente.

[Relatório do executor, matriz, provas e encaminhamento](../evidencias/saneamento-RF15/README.md).

## Saneamento residual do executor — 12/10/2026

Resíduos do parecer cdf0060 tratados localmente: RF15-02 (ocultação imediata), RF15-04 (reatividade do dia local) e detalhes/retorno de foco CF014. Provas originais preservadas; RF15-01/RF15-03 mantêm aceites anteriores. Este registro não concede aprovação: CF010/012/013/014/015 continuam em_revisao e CF011 concluída. Zoom nativo pendente e RVA-03 inconclusivo, sem novos experimentos por ausência de condição técnica/hipótese nova.

[Relatório, matriz residual, capturas e encaminhamento](../evidencias/saneamento-residual-RF15/README.md).