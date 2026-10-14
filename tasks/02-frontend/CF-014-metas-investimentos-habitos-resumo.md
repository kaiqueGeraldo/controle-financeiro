# CF-014 — Auditar metas, investimentos, hábitos e resumo anual

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Parecer independente vigente — 14/10/2026

Diagnóstico dirigido posterior do executor, base8096b22: a ocorrência sustentada
de histórico `opacity: 0` por15s foi atribuída ao relógio do harness, com
contraprova por timeline WAAPI, fixture SQL preexistente, API/estado/DOM e
capturas/interação. Ajuste localizado de harness, produto intacto. Não é novo
aceite independente: estado/checkboxes preservados; encaminhar a causa e o
ajuste a outra revisão e confrontar o critério completo antes de encerrar.
[Diagnóstico, falhas preservadas e limites](../evidencias/investigacao-CF014-historico-invisivel/README.md).

O achado **P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)** está encerrado. Provas originais intactas e complementos confirmam isolamento de B/nova A, execução ativa, UUID/recibo/recuperação de A e formulário utilizável. Estado `em_revisao` mantido exclusivamente pela ocorrência inconclusiva de histórico invisível no critério de histórico/modais operáveis. Demais critérios e aceites acumulados preservados; não houve novo defeito confirmado neste recorte.

[Modelo de identidade, matriz, interface/SQL, timeouts e resultados](../evidencias/revalidacao-RVR24-02-ciclo-visual/README.md). Base cbbf58d..0f9beb1; esta decisão supera as notas anteriores somente no recorte examinado. Nenhuma correção de produto nesta revisão.

## Candidato do executor — ciclo visual, 13/10/2026

P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02): correção local vincula fechamento/loading/erro à instância visual que iniciou a execução, conservando recibo e atualização financeira legítimos de A. Base cbbf58d; provas independentes preservadas, sem reabrir os resíduos já encerrados. Aguarda revalidação dirigida; estado em_revisao. Opacidade do histórico continua investigação separada.

[Causa, identidades, provas e encaminhamento](../evidencias/saneamento-RVR24-02-ciclo-visual/README.md).

## Parecer independente anterior — 13/10/2026

Estado `em_revisao`: resíduos originais de Escape/semântica/foco, detalhe de investimento e edição indevida de hábito encerrados. P2 confirmado no recorte adicional do ciclo visual (vínculo RVR24-02): resposta tardia de A fecha formulário B; um único efeito financeiro correto. Ocorrência opacity0 no histórico continua inconclusiva apesar de reprodução isolada aprovada. RJ-022-01/H24-01 e validação histórica de descrição não encerrados por associação.

[Parecer, critérios completos, provas e encaminhamento restrito](../evidencias/revalidacao-residual-RF15/README.md). Supera os estados correntes das notas anteriores; preserva seu alcance histórico. Produto não alterado nesta revisão.

## Revalidação independente anterior — 12/10/2026

Estado `em_revisao`: RF15-01 encerrado para ação/criação mobile e foco. Metas hoje/concluída, formulários/históricos longos tiveram complemento dirigido. Impedimentos confirmados: Escape/semântica dos detalhes de meta/hábito e retorno de foco perdido na transição de investimento. Não confundir esses consumidores com os RF15-01/03 encerrados. RJ02201/H24-01 permanecem separados sob CF022.

[Parecer, matriz, achados, testes contestados e evidências](../evidencias/revalidacao-RF15/README.md). Supera o estado corrente descrito nas notas anteriores, preservando seu alcance histórico. Sem correção de produto nesta revisão.

## Parecer dirigido anterior — 11/10/2026

Estado `em_revisao`: RF15-01 (P2) confirma criação de hábito sem nome acessível em360px. Interação semanal atual envia POST200 e persiste após reload, sem esclarecer causa histórica RJ-022-01. H24-01 permanece separado sob CF-022. Nota anual/posição e aceites RD58, CF-020/021 e RV24-01 preservados. Modais longos e estados próprios ainda sem prova suficiente estão discriminados na matriz.

[Parecer, matriz por critério, achados, execuções e imagens inspecionadas](../evidencias/fechamento-CF-010-CF-015/README.md). Esta nota supera descrições correntes anteriores; relatórios datados conservam seu alcance histórico. Nenhuma correção de produto nesta revisão.

## Vínculo dirigido — 08/10/2026

A [revisão CF-005–008](../evidencias/revisao-dirigida-CF-005-CF-008/ACHADOS.md)
reproduziu RD58-01 (ano inicial do resumo) e RD58-02 (histórico de metas sem
semântica explícita de instante/legado). Saneamento temporal sob CF-005/006,
com consumidores neste recorte. Não houve revisão integral desta tela ou
mudança de estado da CF-014. RV24-01/CF-009 estão concluídas por aceite posterior;
as referências antigas abaixo não são bloqueios atuais por si sós.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 4, 1, 2 e 3: falta aceite por módulo de metas, investimentos, hábitos e resumo anual nos estados/modais previstos; preservar R01/R04 e regras backend aceitas. RV24-01 requer revisão do saneamento de resultado/lifecycle; RJ-022-01 e H24-01 continuam investigações distintas de CF-022. Condição: parecer por critério e verificações dirigidas das lacunas, sem substituir UI por aceite backend.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

R01/R04 e nota confirmada permanecem aprovados no escopo original. CF-020/021 concluíram
regras financeiras próprias; CF-022 aprovou backend, mas conserva RJ-022-01 e H24-01.
RV24-01 registra risco relacionado em operationModal, ainda sem contraprova dinâmica
equivalente. Estado `em_revisao` mantido: consolidar aceites por módulo e completar
lacunas de consumidores sem inferir aprovação geral a partir de backend ou nota/seleção
corrigidos.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

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

- [x] Meta concluída e vencendo hoje apresentam status esperado; gráfico vazio não representa erro como ausência de patrimônio.
- [ ] Calendário de hábito e histórico preservam data; modais longos continuam operáveis.
- [x] Nota anual salva sobrevive ao reload; posição atual exibida em ano passado é encaminhada a CF-021, sem snapshot legitimando ambiguidade.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Novos módulos de vida, redesign completo ou mudança de cálculo de ativos/metas.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 13/09/2026 sobre a base local
`1ced2f027fa46ab265b211829375581880cbb07b`, preservando o patch preexistente
das CF-010–013. Metas, investimentos e resumo anual agora distinguem leitura
com falha de coleção vazia; a posição atual não é exibida como fechamento de
ano passado; e nota anual só fecha a edição após confirmação. A [evidência
completa](../evidencias/CF-014/README.md) registra os oracles, mutações,
comandos e limites.

CF-015 recebe esta dependência como satisfeita, mas ainda não está formalmente
liberada enquanto CF-012 e CF-013 permanecerem `em_revisao`. CF-020, CF-021 e
CF-022 não foram alteradas: continuam donas, respectivamente, de
alocações/posições, reconstrução histórica e regras de hábito.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R01/R04 reproduzem ano obsoleto e rascunho exibido como salvo sem persistir. P05 revalidado nos três fusos; posição histórica indisponível não encerra os defeitos de estado/nota.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R01/R04: resumo e nota respeitam ano/sessão/versão enviada. Refetch e falha preservam rascunho, confirmação tardia não fecha edição posterior e texto confirmado é verificado após HTTP/reload/PostgreSQL. Metadados e contrato temporal foram preservados.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R01/R04 encerrados no escopo original; nota confirmada verificada por GET, reload e SQL. A revisão dirigida não certifica integralmente todos os módulos da tarefa. Estado em_revisao mantido.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).


## Candidato de saneamento RF15 — 11/10/2026

RF15-01 corrigido localmente: ação Novo Hábito nomeada no mobile e retorno de foco na criação. Complemento da matriz registrou hoje/concluída, históricos e formulários longos. Detalhes customizados de meta/hábito permanecem sem Escape/semântica de diálogo; investimento termina em BODY após substituir o acionador pelo formulário. Resíduos encaminhados sem ampliar silenciosamente o lote. Estado em_revisao.

[Relatório do executor, matriz, provas e encaminhamento](../evidencias/saneamento-RF15/README.md).

## Saneamento residual do executor — 12/10/2026

Resíduos do parecer cdf0060 tratados localmente: RF15-02 (ocultação imediata), RF15-04 (reatividade do dia local) e detalhes/retorno de foco CF014. Provas originais preservadas; RF15-01/RF15-03 mantêm aceites anteriores. Este registro não concede aprovação: CF010/012/013/014/015 continuam em_revisao e CF011 concluída. Zoom nativo pendente e RVA-03 inconclusivo, sem novos experimentos por ausência de condição técnica/hipótese nova.

[Relatório, matriz residual, capturas e encaminhamento](../evidencias/saneamento-residual-RF15/README.md).
