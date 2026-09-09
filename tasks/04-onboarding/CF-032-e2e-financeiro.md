# CF-032 — Validar jornada financeira completa e uso diário

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-021](../03-integridade/CF-021-relatorios.md), [CF-022](../03-integridade/CF-022-habitos-crons.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md), [CF-026](../03-integridade/CF-026-lint-tipagem-frontend.md), [CF-031](../04-onboarding/CF-031-entrevista-frontend.md)
- Origem: T-006, T-007, T-008, T-009

## Problema e resultado esperado

Demonstrar que os módulos funcionam juntos com saldo persistido, não somente isoladamente ou com APIs mockadas.

## Escopo e referências

- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`
- `tasks/evidencias/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Executar registrar→entrevista→receita/despesa→transferência→compra/pagamento→investimento/meta→relatório/exportação→logout/login.
2. Conferir estado após reload e reconciliar patrimônio/saldos/compromissos em pontos definidos pelo oracle.
3. Cobrir usuário legado, contas a receber, prazo/hábito e falha/reenvio durante uma operação monetária; particionar cenários para diagnóstico.

## Aceite e testes adversariais

- [ ] Percurso usa Next BFF, Spring e PostgreSQL reais; só integrações externas são substituídas.
- [ ] Reload/nova sessão recuperam o mesmo estado e relatório/exportação concilia; nenhum teste espera apenas toast.
- [ ] Pelo menos um cenário com dois usuários confirma isolamento enquanto ambos usam o app; falhas mantêm invariantes.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Suite monolítica dependente da ordem, E2E fictício com respostas financeiras pré-programadas.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-032/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

