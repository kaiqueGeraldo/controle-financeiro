# Catálogo de tarefas

36 tarefas individuais para frontend e backend, organizadas por dependência e risco. Estado canônico em cada arquivo; este índice não duplica status. Leia [execução](EXECUCAO.md), [testes](POLITICA-DE-TESTES.md) e [modelos](MODELOS.md).

## Ordem e marcos

- **Marco 1: CF-001 a CF-015.** Fundação, datas, erros/estado assíncrono e revisão de todas as telas existentes. Prioridade expressa do usuário.
- **Marco 2: CF-016 a CF-027.** Integridade, migrações, isolamento, concorrência, desempenho e manutenção.
- **Marco 3: CF-028 a CF-032.** Contrato e implementação do onboarding com percurso financeiro real.
- **Marco 4: CF-033 a CF-036.** Revisão adversarial, CI, homologação e publicação.

A numeração oferece uma sequência segura; não implica que tarefas sem dependência devam ser executadas simultaneamente. CF-016 pode ser especificada após suas dependências, sem deslocar a prioridade do Marco 1. Os testes fazem parte de cada tarefa, não ficam reservados ao fim.

## Fundação dos testes

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-001 — Fixar critérios e resultados esperados independentes](00-fundacao/CF-001-criterios-e-oracles.md) | Astra / xhigh | nenhuma |
| [CF-002 — Preparar backend e PostgreSQL isolados para testes](00-fundacao/CF-002-ambiente-backend.md) | Sol / high | nenhuma |
| [CF-003 — Preparar testes de componente e navegador](00-fundacao/CF-003-harness-frontend.md) | Sol / high | nenhuma |

## Datas e integração

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-004 — Definir contrato de datas civis, instantes e competências](01-datas-integracao/CF-004-contrato-temporal.md) | Astra / xhigh | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md) |
| [CF-005 — Completar regressões e correções temporais do frontend](01-datas-integracao/CF-005-datas-frontend.md) | Sol / high | [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-004](01-datas-integracao/CF-004-contrato-temporal.md) |
| [CF-006 — Aplicar relógio e serialização temporal consistentes no backend](01-datas-integracao/CF-006-datas-backend.md) | Sol / xhigh | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-004](01-datas-integracao/CF-004-contrato-temporal.md) |
| [CF-007 — Validar datas pelo fluxo navegador–API–banco](01-datas-integracao/CF-007-e2e-temporal.md) | Sol / xhigh | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-006](01-datas-integracao/CF-006-datas-backend.md) |
| [CF-008 — Corrigir contratos HTTP e erros entre front e back](01-datas-integracao/CF-008-erros-e-contratos.md) | Sol / high | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-004](01-datas-integracao/CF-004-contrato-temporal.md) |
| [CF-009 — Corrigir corridas de requisição e mutações otimistas](01-datas-integracao/CF-009-estado-assincrono.md) | Sol / xhigh | [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md) |

## Frontend e primeiro marco

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-010 — Corrigir modais, layout e acessibilidade compartilhados](02-frontend/CF-010-componentes-comuns.md) | Terra / high | [CF-003](00-fundacao/CF-003-harness-frontend.md) |
| [CF-011 — Auditar e corrigir autenticação e configurações](02-frontend/CF-011-auth-configuracoes.md) | Terra / high | [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](02-frontend/CF-010-componentes-comuns.md) |
| [CF-012 — Auditar e corrigir dashboard, contas e extrato](02-frontend/CF-012-dashboard-contas-extrato.md) | Terra / high | [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](02-frontend/CF-010-componentes-comuns.md) |
| [CF-013 — Auditar e corrigir cartões, faturas e planejamento](02-frontend/CF-013-cartoes-planejamento.md) | Terra / high | [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](02-frontend/CF-010-componentes-comuns.md) |
| [CF-014 — Auditar metas, investimentos, hábitos e resumo anual](02-frontend/CF-014-metas-investimentos-habitos-resumo.md) | Terra / high | [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](02-frontend/CF-010-componentes-comuns.md) |
| [CF-015 — Revisar independentemente o marco de datas e frontend](02-frontend/CF-015-revisao-marco-frontend.md) | Astra / xhigh | [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-009](01-datas-integracao/CF-009-estado-assincrono.md), [CF-011](02-frontend/CF-011-auth-configuracoes.md), [CF-012](02-frontend/CF-012-dashboard-contas-extrato.md), [CF-013](02-frontend/CF-013-cartoes-planejamento.md), [CF-014](02-frontend/CF-014-metas-investimentos-habitos-resumo.md) |

## Integridade e manutenção

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-016 — Especificar abertura, fluxo realizado, dívida e reservas](03-integridade/CF-016-regras-financeiras.md) | Astra / xhigh | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md), [CF-004](01-datas-integracao/CF-004-contrato-temporal.md) |
| [CF-017 — Criar migrações reproduzíveis e plano para banco legado](03-integridade/CF-017-migracoes.md) | Sol / xhigh | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-016](03-integridade/CF-016-regras-financeiras.md) |
| [CF-018 — Corrigir contas, abertura e fluxo de transações](03-integridade/CF-018-contas-transacoes.md) | Sol / xhigh | [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-017](03-integridade/CF-017-migracoes.md) |
| [CF-019 — Validar faturas, parcelamento e pagamento](03-integridade/CF-019-cartoes-faturas.md) | Sol / xhigh | [CF-006](01-datas-integracao/CF-006-datas-backend.md), [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-017](03-integridade/CF-017-migracoes.md), [CF-018](03-integridade/CF-018-contas-transacoes.md) |
| [CF-020 — Corrigir posições de investimentos e alocações de metas](03-integridade/CF-020-investimentos-metas.md) | Sol / xhigh | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-017](03-integridade/CF-017-migracoes.md), [CF-018](03-integridade/CF-018-contas-transacoes.md) |
| [CF-021 — Conciliar dashboard, resumo anual e exportação](03-integridade/CF-021-relatorios.md) | Sol / high | [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md) |
| [CF-022 — Validar hábitos e execução dos crons](03-integridade/CF-022-habitos-crons.md) | Sol / high | [CF-006](01-datas-integracao/CF-006-datas-backend.md), [CF-017](03-integridade/CF-017-migracoes.md) |
| [CF-023 — Verificar isolamento por usuário e sessão](03-integridade/CF-023-isolamento-autenticacao.md) | Sol / xhigh | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-017](03-integridade/CF-017-migracoes.md) |
| [CF-024 — Corrigir concorrência financeira e cache após commit](03-integridade/CF-024-concorrencia-cache.md) | Sol / xhigh | [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md) |
| [CF-025 — Medir e corrigir N+1 e consultas ineficientes](03-integridade/CF-025-consultas-desempenho.md) | Sol / high | [CF-021](03-integridade/CF-021-relatorios.md), [CF-022](03-integridade/CF-022-habitos-crons.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md) |
| [CF-026 — Eliminar dívida de lint e tipagem sem esconder defeitos](03-integridade/CF-026-lint-tipagem-frontend.md) | Terra / high | [CF-009](01-datas-integracao/CF-009-estado-assincrono.md), [CF-015](02-frontend/CF-015-revisao-marco-frontend.md) |
| [CF-027 — Organizar fronteiras do backend incrementalmente](03-integridade/CF-027-fronteiras-backend.md) | Sol / high | [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-022](03-integridade/CF-022-habitos-crons.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md) |

## Onboarding e jornada completa

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-028 — Finalizar contrato da entrevista inicial](04-onboarding/CF-028-contrato-onboarding.md) | Astra / xhigh | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md) |
| [CF-029 — Implementar rascunho autenticado e retomável](04-onboarding/CF-029-rascunho-backend.md) | Sol / high | [CF-017](03-integridade/CF-017-migracoes.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md), [CF-028](04-onboarding/CF-028-contrato-onboarding.md) |
| [CF-030 — Finalizar onboarding com atomicidade e idempotência](04-onboarding/CF-030-finalizacao-backend.md) | Sol / xhigh | [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md), [CF-029](04-onboarding/CF-029-rascunho-backend.md) |
| [CF-031 — Construir entrevista inicial e revisão final](04-onboarding/CF-031-entrevista-frontend.md) | Sol / high | [CF-015](02-frontend/CF-015-revisao-marco-frontend.md), [CF-028](04-onboarding/CF-028-contrato-onboarding.md), [CF-029](04-onboarding/CF-029-rascunho-backend.md), [CF-030](04-onboarding/CF-030-finalizacao-backend.md) |
| [CF-032 — Validar jornada financeira completa e uso diário](04-onboarding/CF-032-e2e-financeiro.md) | Sol / xhigh | [CF-021](03-integridade/CF-021-relatorios.md), [CF-022](03-integridade/CF-022-habitos-crons.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md), [CF-026](03-integridade/CF-026-lint-tipagem-frontend.md), [CF-031](04-onboarding/CF-031-entrevista-frontend.md) |

## Revisão, CI e publicação

| Tarefa | Modelo / esforço | Dependências |
|---|---|---|
| [CF-033 — Revisar integridade, testes e comportamento final](05-release/CF-033-revisao-adversarial.md) | Astra / xhigh | [CF-025](03-integridade/CF-025-consultas-desempenho.md), [CF-027](03-integridade/CF-027-fronteiras-backend.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md) |
| [CF-034 — Consolidar gates de CI reproduzíveis](05-release/CF-034-gates-ci.md) | Sol / high | [CF-015](02-frontend/CF-015-revisao-marco-frontend.md), [CF-026](03-integridade/CF-026-lint-tipagem-frontend.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md), [CF-033](05-release/CF-033-revisao-adversarial.md) |
| [CF-035 — Preparar homologação, backup e reversão](05-release/CF-035-homologacao-preservacao.md) | Sol / high | [CF-017](03-integridade/CF-017-migracoes.md), [CF-034](05-release/CF-034-gates-ci.md) |
| [CF-036 — Publicar versão validada e verificar produção](05-release/CF-036-publicacao.md) | Astra / high | [CF-033](05-release/CF-033-revisao-adversarial.md), [CF-034](05-release/CF-034-gates-ci.md), [CF-035](05-release/CF-035-homologacao-preservacao.md) |

## Gates e risco operacional

CF-015 valida o primeiro marco, sem declarar o projeto inteiro pronto. CF-033 revisa regras e testes do conjunto. CF-036 depende de CI aprovado e homologação com preservação comprovada do banco.

Estado do banco Railway ainda não confirmado. Isso impede certificar migração/publicação remota, mas não impede ambiente descartável, testes, correções de datas ou auditoria de UI. Capturas e fixtures devem ser sintéticas.

Não há execução automática nem seleção de modelo causada por estes arquivos. Para iniciar, usar o prompt de EXECUCAO.md apontando para a tarefa escolhida.

