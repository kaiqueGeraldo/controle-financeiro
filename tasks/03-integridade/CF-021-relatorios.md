# CF-021 — Conciliar dashboard, resumo anual e exportação

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md)
- Origem: T-004; F-009, F-010

## Problema e resultado esperado

Resumo anual mistura transações por ano e posições atuais. Totais também precisam refletir regime e filtros iguais entre telas e exportação.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/AnnualSummaryService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/DashboardService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/transaction/TransactionRepository.java`
- `controle-financeiro-frontend/src/components/screens/annual-summary/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Aplicar decisão de período/posição da CF-016 e separar custo investido, valor atual e abertura.
2. Reconciliar extrato paginado/filtrado, dashboard, relatório anual e XLSX com dataset conhecido.
3. Adicionar casos de zero, ausência de histórico, ano anterior, transferência e compromisso não pago.

## Aceite e testes adversariais

- [ ] Trocar de página não muda total global indevidamente; filtros têm semântica explícita em cada agregado.
- [ ] Ano anterior não recebe posição atual rotulada como histórica; falta de histórico não vira zero plausível.
- [ ] Dados exportados reproduzem valores/datas calculados independentemente para o mesmo escopo e período.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Criar snapshots históricos inventados ou testar fórmula calculando expected pela query de produção.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-021/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

