# Plano de execução

O Git conserva planos, decisões, política de testes e entradas sintéticas reutilizáveis. Logs, capturas, dumps, relatórios e recibos locais de execução ficam no arquivo privado. A ausência dessas provas nesta árvore não as invalida nem transforma pendências em aceites.

Consulte a [política de testes](POLITICA-DE-TESTES.md), o [guia de execução](EXECUCAO.md) e as [decisões de engenharia](../docs/sdd/README.md). Estados e dependências são definidos em cada tarefa. CF-034 integral e CF-017/P01/P02 conservam seus critérios; CI verde não autoriza deploy ou adoção real.

## Tarefas

- [CF-001-criterios-e-oracles](00-fundacao/CF-001-criterios-e-oracles.md)
- [CF-002-ambiente-backend](00-fundacao/CF-002-ambiente-backend.md)
- [CF-003-harness-frontend](00-fundacao/CF-003-harness-frontend.md)
- [CF-004-contrato-temporal](01-datas-integracao/CF-004-contrato-temporal.md)
- [CF-005-datas-frontend](01-datas-integracao/CF-005-datas-frontend.md)
- [CF-006-datas-backend](01-datas-integracao/CF-006-datas-backend.md)
- [CF-007-e2e-temporal](01-datas-integracao/CF-007-e2e-temporal.md)
- [CF-008-erros-e-contratos](01-datas-integracao/CF-008-erros-e-contratos.md)
- [CF-009-estado-assincrono](01-datas-integracao/CF-009-estado-assincrono.md)
- [RV24-01-criacao-resultado-desconhecido](01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md)
- [CF-010-componentes-comuns](02-frontend/CF-010-componentes-comuns.md)
- [CF-011-auth-configuracoes](02-frontend/CF-011-auth-configuracoes.md)
- [CF-012-dashboard-contas-extrato](02-frontend/CF-012-dashboard-contas-extrato.md)
- [CF-013-cartoes-planejamento](02-frontend/CF-013-cartoes-planejamento.md)
- [CF-014-metas-investimentos-habitos-resumo](02-frontend/CF-014-metas-investimentos-habitos-resumo.md)
- [CF-015-revisao-marco-frontend](02-frontend/CF-015-revisao-marco-frontend.md)
- [CF-016-regras-financeiras](03-integridade/CF-016-regras-financeiras.md)
- [CF-017-P01-P02-adocao-temporal](03-integridade/CF-017-P01-P02-adocao-temporal.md)
- [CF-017-migracoes](03-integridade/CF-017-migracoes.md)
- [CF-018-contas-transacoes](03-integridade/CF-018-contas-transacoes.md)
- [CF-019-cartoes-faturas](03-integridade/CF-019-cartoes-faturas.md)
- [CF-020-investimentos-metas](03-integridade/CF-020-investimentos-metas.md)
- [CF-021-relatorios](03-integridade/CF-021-relatorios.md)
- [CF-022-habitos-crons](03-integridade/CF-022-habitos-crons.md)
- [CF-023-isolamento-autenticacao](03-integridade/CF-023-isolamento-autenticacao.md)
- [CF-024-concorrencia-cache](03-integridade/CF-024-concorrencia-cache.md)
- [CF-025-consultas-desempenho](03-integridade/CF-025-consultas-desempenho.md)
- [CF-026-lint-tipagem-frontend](03-integridade/CF-026-lint-tipagem-frontend.md)
- [CF-027-fronteiras-backend](03-integridade/CF-027-fronteiras-backend.md)
- [RV24-02-exclusao-usuario-vinculos](03-integridade/RV24-02-exclusao-usuario-vinculos.md)
- [CF-028-contrato-onboarding](04-onboarding/CF-028-contrato-onboarding.md)
- [CF-029-rascunho-backend](04-onboarding/CF-029-rascunho-backend.md)
- [CF-030-finalizacao-backend](04-onboarding/CF-030-finalizacao-backend.md)
- [CF-031-entrevista-frontend](04-onboarding/CF-031-entrevista-frontend.md)
- [CF-032-e2e-financeiro](04-onboarding/CF-032-e2e-financeiro.md)
- [CF-033-revisao-adversarial](05-release/CF-033-revisao-adversarial.md)
- [CF-034-gates-ci](05-release/CF-034-gates-ci.md)
- [CF-035-homologacao-preservacao](05-release/CF-035-homologacao-preservacao.md)
- [CF-036-publicacao](05-release/CF-036-publicacao.md)
- [EVIDENCIA](templates/EVIDENCIA.md)
- [TAREFA](templates/TAREFA.md)

## Evidências

[Política de publicação e entradas retidas](EVIDENCIAS.md). Registros de execução citados em documentos históricos são privados.
