# Rastreabilidade do SDD

As tarefas CF são a fonte atual de execução. IDs F continuam identificando achados; IDs T identificam os épicos definidos no diagnóstico inicial. Não renumerar achados antigos nem copiar seus status como se as tarefas novas já estivessem executadas.

## Épicos anteriores → tarefas executáveis

| Épico | Responsabilidade | Tarefas |
|---|---|---|
| T-001 | Diagnóstico e estrutura | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md), [CF-004](01-datas-integracao/CF-004-contrato-temporal.md), [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-027](03-integridade/CF-027-fronteiras-backend.md) |
| T-002 | Calendário frontend | [CF-004](01-datas-integracao/CF-004-contrato-temporal.md), [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-015](02-frontend/CF-015-revisao-marco-frontend.md) |
| T-003 | Contratos e erros | [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-009](01-datas-integracao/CF-009-estado-assincrono.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md) |
| T-004 | Integridade e abertura | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-021](03-integridade/CF-021-relatorios.md) |
| T-005 | Schema e backend reproduzível | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-017](03-integridade/CF-017-migracoes.md) |
| T-006 | Onboarding backend | [CF-028](04-onboarding/CF-028-contrato-onboarding.md), [CF-029](04-onboarding/CF-029-rascunho-backend.md), [CF-030](04-onboarding/CF-030-finalizacao-backend.md) |
| T-007 | Entrevista frontend | [CF-028](04-onboarding/CF-028-contrato-onboarding.md), [CF-031](04-onboarding/CF-031-entrevista-frontend.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md) |
| T-008 | Auditoria visual e funcional | [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-010](02-frontend/CF-010-componentes-comuns.md), [CF-011](02-frontend/CF-011-auth-configuracoes.md), [CF-012](02-frontend/CF-012-dashboard-contas-extrato.md), [CF-013](02-frontend/CF-013-cartoes-planejamento.md), [CF-014](02-frontend/CF-014-metas-investimentos-habitos-resumo.md), [CF-015](02-frontend/CF-015-revisao-marco-frontend.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md) |
| T-009 | Concorrência, consultas e limites | [CF-009](01-datas-integracao/CF-009-estado-assincrono.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md), [CF-025](03-integridade/CF-025-consultas-desempenho.md), [CF-027](03-integridade/CF-027-fronteiras-backend.md), [CF-033](05-release/CF-033-revisao-adversarial.md) |
| T-010 | Tempo no backend | [CF-004](01-datas-integracao/CF-004-contrato-temporal.md), [CF-006](01-datas-integracao/CF-006-datas-backend.md), [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-022](03-integridade/CF-022-habitos-crons.md) |
| T-011 | Qualidade contínua | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md), [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-026](03-integridade/CF-026-lint-tipagem-frontend.md), [CF-033](05-release/CF-033-revisao-adversarial.md), [CF-034](05-release/CF-034-gates-ci.md) |
| T-012 | Homologação e deploy | [CF-035](05-release/CF-035-homologacao-preservacao.md), [CF-036](05-release/CF-036-publicacao.md) |

## Achados → verificação e correção

| Achado | Tema | Tarefas |
|---|---|---|
| F-001–004 | Datas, defaults, prazos e competências | [CF-004](01-datas-integracao/CF-004-contrato-temporal.md), [CF-005](01-datas-integracao/CF-005-datas-frontend.md), [CF-006](01-datas-integracao/CF-006-datas-backend.md), [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-015](02-frontend/CF-015-revisao-marco-frontend.md) |
| F-005–006 | 401/403 e validação HTTP | [CF-008](01-datas-integracao/CF-008-erros-e-contratos.md), [CF-011](02-frontend/CF-011-auth-configuracoes.md), [CF-023](03-integridade/CF-023-isolamento-autenticacao.md) |
| F-007 | Concorrência e estado assíncrono | [CF-009](01-datas-integracao/CF-009-estado-assincrono.md), [CF-024](03-integridade/CF-024-concorrencia-cache.md), [CF-033](05-release/CF-033-revisao-adversarial.md) |
| F-008 | Onboarding e inicialização | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-028](04-onboarding/CF-028-contrato-onboarding.md), [CF-029](04-onboarding/CF-029-rascunho-backend.md), [CF-030](04-onboarding/CF-030-finalizacao-backend.md), [CF-031](04-onboarding/CF-031-entrevista-frontend.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md) |
| F-009 | Abertura/realizado/reservas | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-018](03-integridade/CF-018-contas-transacoes.md), [CF-019](03-integridade/CF-019-cartoes-faturas.md), [CF-020](03-integridade/CF-020-investimentos-metas.md), [CF-021](03-integridade/CF-021-relatorios.md) |
| F-010 | Posição atual versus anual | [CF-016](03-integridade/CF-016-regras-financeiras.md), [CF-021](03-integridade/CF-021-relatorios.md) |
| F-011 | Migrações | [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-017](03-integridade/CF-017-migracoes.md), [CF-035](05-release/CF-035-homologacao-preservacao.md) |
| F-012 | Suites/CI insuficientes | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md), [CF-002](00-fundacao/CF-002-ambiente-backend.md), [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-007](01-datas-integracao/CF-007-e2e-temporal.md), [CF-032](04-onboarding/CF-032-e2e-financeiro.md), [CF-033](05-release/CF-033-revisao-adversarial.md), [CF-034](05-release/CF-034-gates-ci.md) |
| F-013 | Queries e reordenação | [CF-025](03-integridade/CF-025-consultas-desempenho.md) |
| F-014 | Documentação/CI divergentes | [CF-001](00-fundacao/CF-001-criterios-e-oracles.md), [CF-034](05-release/CF-034-gates-ci.md), [CF-035](05-release/CF-035-homologacao-preservacao.md) |
| F-015 | Auditoria visual pendente | [CF-003](00-fundacao/CF-003-harness-frontend.md), [CF-010](02-frontend/CF-010-componentes-comuns.md), [CF-011](02-frontend/CF-011-auth-configuracoes.md), [CF-012](02-frontend/CF-012-dashboard-contas-extrato.md), [CF-013](02-frontend/CF-013-cartoes-planejamento.md), [CF-014](02-frontend/CF-014-metas-investimentos-habitos-resumo.md), [CF-015](02-frontend/CF-015-revisao-marco-frontend.md) |
| F-016 | Wrapper/ambiente | [CF-002](00-fundacao/CF-002-ambiente-backend.md) |
| F-017 | Lint | [CF-026](03-integridade/CF-026-lint-tipagem-frontend.md), [CF-034](05-release/CF-034-gates-ci.md) |

## Trabalho anterior preservado

O diagnóstico/SDD inicial e o patch de calendário já existem no checkout, incluindo testes unitários em três fusos, build e typecheck aprovados na sessão anterior. Isso não executa CF-001/005/007/015: essas tarefas formalizam critérios, verificam capacidade de detectar regressão, consumidores e comportamento real integrado.

F-014 teve README e nome de variável corrigidos; CF-034/035 verificam a configuração no pipeline/ambiente final. F-017 é baseline anterior, a ser recontado; não tratar a quantidade inicial como meta imutável.

## Controles para novos achados

Durante auditorias visuais/funcionais, atribuir próximo F disponível e criar tarefa CF derivada com fonte, reprodução, esperado, escopo e dependência do marco correspondente. Não classificar um cenário não executado como aprovado. Atualizar este mapa se a responsabilidade mudar; o estado fica somente no arquivo da tarefa.

