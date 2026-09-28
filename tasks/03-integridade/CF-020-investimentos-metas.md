# CF-020 — Corrigir posições de investimentos e alocações de metas

- Estado: em_revisao
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
