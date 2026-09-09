# CF-029 — Implementar rascunho autenticado e retomável

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-017](../03-integridade/CF-017-migracoes.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md), [CF-028](../04-onboarding/CF-028-contrato-onboarding.md)
- Origem: T-006; F-008

## Problema e resultado esperado

Usuário precisa responder por etapas sem perder dados ou criar saldos parcialmente. Rascunho deve permanecer isolado dos módulos financeiros até confirmação.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar sessão de onboarding, versionamento, GET e PUT de rascunho conforme CF-028.
2. Validar campos/referências temporárias/limites e status de novo usuário versus legado; migrar schema versionadamente.
3. Testar save/retomada, versão antiga e sessão expirada sem registrar payload financeiro em logs.

## Aceite e testes adversariais

- [ ] Salvar rascunho não altera conta, fatura, investimento ou saldo real.
- [ ] Duas abas com versão antiga produzem conflito explícito, sem perder silenciosamente respostas.
- [ ] A não acessa rascunho de B; dados sobrevivem a reload/novo login e erros apontam campo.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Finalizar posições financeiras ou guardar rascunho em localStorage.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-029/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

