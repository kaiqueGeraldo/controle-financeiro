# CF-020 — Corrigir posições de investimentos e alocações de metas

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-016](../03-integridade/CF-016-regras-financeiras.md), [CF-017](../03-integridade/CF-017-migracoes.md), [CF-018](../03-integridade/CF-018-contas-transacoes.md)
- Origem: T-004; F-008, F-009

## Problema e resultado esperado

Investimentos e metas monetárias podem compartilhar o mesmo dinheiro. Cadastro inicial e operações devem preservar essa relação sem somar patrimônio duas vezes.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/InvestmentService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/GoalService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/investment/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/goal/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Implementar posições/custo e destinação conforme CF-016; validar disponibilidade por fonte e vínculo do proprietário.
2. Testar compra/venda/taxa/provento, preço médio, aporte/retirada e checklist com estorno.
3. Permitir progresso inicial numérico e alocação monetária sem criar transação passada fictícia.

## Aceite e testes adversariais

- [x] Alocar 300 de conta 1.000 muda disponível, não patrimônio; duas metas não excedem fonte disponível.
- [x] Venda parcial/taxas preservam precisão e custo esperado; cotação indisponível não grava zero como valor confirmado.
- [x] Excluir item/meta e estornar compra bancária preserva saldo/origem; nova tentativa não repete compensação.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Recomendações de investimento, integração nova com corretora ou duplicação de ativos por meta.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Implementação backend e migração V5 concluídas localmente em 28/09/2026 sobre `59d98fa`, commits `3746e8e` e `d11359e`. Gate final PostgreSQL: 162 testes, zero falhas/erros/ignorados. CF-016 está concluída; CF-017/018 e CF-019 estão integradas na base local, mas ainda `em_revisao`, sem adoção em banco real. O `README.md` preexistente permaneceu fora do escopo. [Evidências, decisões e pendências](../evidencias/CF-020/README.md).

Estado `em_revisao` não certifica produto completo: adaptação dos consumidores frontend, motivo/data obrigatórios em ajuste manual, correção rastreável de operações de investimento, reembolso de cartão após exclusão e agregados de CF-021 ainda exigem trabalho ou revisão. A CF-021 pode iniciar localmente sobre esta base integrada, condicionada aos gates de revisão; CF-024/027/028/030 ainda têm outras dependências abertas. Não houve deploy, migração real nem revisão independente.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Saneamento do marco em 30/09/2026

RVI-06/07/13–18 e parte de RVI-21: checklist em lote com fonte real, compra/fato/reembolso sobrevivem à exclusão; hora interna canônica. B08 renda fixa monetária preserva principal/custo/avaliação/taxas/ganho; desconhecido e encerramento zero distintos. NG-01 total proporcional. Avaliação auditada e compensação pela UI conserva operação original e recalcula custos dependentes em revisão separada; caso 20×10+2→20×8+2 após venda 5×15-1 deixa banco 912/custo 121.50.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Revalidação independente — 30/09/2026

Aceite integral não aprovado: compensação de provento altera referência proporcional (RVA-01) e encerramento mantém custo residual null (RVA-02). Consulte a [matriz e o parecer](../evidencias/revalidacao-CF-016-CF-021/README.md) antes de considerar o marco encerrado. Sem correção de produto ou início de CF-022+ nesta revisão.

## Saneamento dirigido dos residuais — 30/09/2026

RVA-01/RVA-02 corrigidos/verificados localmente: replay conserva referência TOTAL/PRICE; encerramento zera somente custo residual, mantendo custo baixado/ganho histórico desconhecidos. Duas provas originais vermelhas passaram sem editar critérios; 62 testes backend afetados e consumidor SAN-RVA aprovados. RVA-03 e revisão independente mantêm o aceite integral pendente.

[Evidências e situação dos três pontos](../evidencias/saneamento-CF-016-CF-021-residuais/README.md). Estado em_revisao, sem publicação ou avanço para CF-022+.

## Revalidação dirigida dos resíduos — 30/09/2026

RVA-01/RVA-02 aprovados independentemente no intervalo e927aea..0099185: referência/modalidade/metadados preservados, sequência0,67→0,33→0; custo remanescente zero só no encerramento, histórico desconhecido preservado. 62 testes dirigidos e consumidor SAN-RVA/API/reload/SQL aprovados. Encerramentos anteriores mantidos; RVA-03 permanece inconclusivo e impede aceite integrado irrestrito, sem novo defeito financeiro demonstrado. Estado `em_revisao`; aprovação do reparo não é encerramento integral nem início de tarefa posterior. [Parecer e evidências](../evidencias/revalidacao-CF-016-CF-021-residuais/README.md).

## Consolidação de aceite — 30/09/2026

Concluída no escopo próprio: reserva/capacidade sem criar patrimônio,
custo/venda/taxas/avaliação indisponível e exclusão/reembolso/origem/retry foram
cruzados com os encerramentos RVI-13–18/21, H-01 e os pareceres independentes.
RVA-01/RVA-02 encerram as bordas residuais de proporcionalidade e posição vazia;
os critérios antes pendentes estão atendidos. Histórico/proveniência desconhecidos
continuam desconhecidos. [Matriz e evidências](../evidencias/revisao-CF-022-CF-023/MATRIZ-ESTADOS.md).
RVA-03 permanece na CF-019 e no aceite da jornada conjunta; nenhum achado foi
transferido ou apagado para concluir esta tarefa. Não há defeito financeiro novo
demonstrado no reembolso/custo que reabra estes critérios. CF-024/025/017 e os
gates de publicação continuam obrigatórios.
