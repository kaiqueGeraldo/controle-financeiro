# CF-021 — Conciliar dashboard, resumo anual e exportação

- Estado: em_revisao
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

- [x] Trocar de página não muda total global indevidamente; filtros têm semântica explícita em cada agregado.
- [x] Ano anterior não recebe posição atual rotulada como histórica; falta de histórico não vira zero plausível.
- [x] Dados exportados reproduzem valores/datas calculados independentemente para o mesmo escopo e período.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Criar snapshots históricos inventados ou testar fórmula calculando expected pela query de produção.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Implementação local encerrada em 28/09/2026 sobre `bfa0855`, com CF-018/019/020 integradas mas ainda em revisão. `README.md` preexistente ficou fora do staging. O contrato HTTP/XLSX e os consumidores do extrato, dashboard, contas e investimentos exigiram edições pontuais fora dos quatro caminhos principais: controller/service/DTOs, repositórios de cartão e operações de investimento, hooks/contextos/tipos, componentes e testes. A justificativa é impedir que API e UI continuem apresentando totais de página, avaliação sem cotação ou patrimônio histórico fabricado após a correção dos agregados. O teste PostgreSQL reproduziu falhas financeiras antes da correção; a [evidência](../evidencias/CF-021/README.md) registra oráculos, comandos, escopo e riscos. O estado é `em_revisao` até revisão independente; não houve deploy, migração em banco real nem E2E integrado nesta execução.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Saneamento do marco em 30/09/2026

RVI-04/05/08/10/20/22 e H-02: posição inclui arquivo e permanece atual datada em qualquer ano; cobertura/origem/faixa separadas de subtotal observado exato em API/UI/XLSX. E27 caixa 9/0 distinto de gerencial 10/1. Filtros e download têm escopo consistente; export REPEATABLE_READ comprovado com writer independente entre páginas. Capturas 360/768/1440, PostgreSQL/reload e arquivos baixados verificados. Não certifica zoom nativo 200%.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Revalidação independente — 30/09/2026

Cobertura, filtros, caixa e snapshot revalidados no recorte; aceite integrado depende das pendências de CF-019/020. Consulte a [matriz e o parecer](../evidencias/revalidacao-CF-016-CF-021/README.md) antes de considerar o marco encerrado. Sem correção de produto ou início de CF-022+ nesta revisão.

## Saneamento dirigido dos residuais — 30/09/2026

Posição encerrada passa a apresentar custo residual conhecido zero, inclusive leitura de null bruto legado sem backfill. Ganho/cobertura históricos continuam desconhecidos. Relatórios/backend e SAN-RVA com reload revalidados; encerramentos anteriores preservados. Aceite integrado segue condicionado à revisão independente e RVA-03.

[Evidências e situação dos três pontos](../evidencias/saneamento-CF-016-CF-021-residuais/README.md). Estado em_revisao, sem publicação ou avanço para CF-022+.

## Revalidação dirigida dos resíduos — 30/09/2026

RVA-02 aprovado independentemente: posição encerrada com custo residual0, legado rawNULL preservado na persistência, custo baixado/ganho/proveniência desconhecidos sem conversão geral de null. Testes dirigidos de posição/anual/dashboard e SAN-RVA/API/reload/SQL aprovados. H01/H02 e demais encerramentos anteriores mantidos. Estado `em_revisao`; aceite integrado irrestrito conserva ressalva RVA-03, sem bloquear automaticamente trabalhos independentes. [Parecer e evidências](../evidencias/revalidacao-CF-016-CF-021-residuais/README.md).
