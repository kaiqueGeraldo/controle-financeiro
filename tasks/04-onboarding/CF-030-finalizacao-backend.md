# CF-030 — Finalizar onboarding com atomicidade e idempotência

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md), [CF-029](../04-onboarding/CF-029-rascunho-backend.md)
- Origem: T-006; F-008, F-009

## Problema e resultado esperado

Reenvio ou falha no último item não pode duplicar patrimônio nem deixar metade da entrevista aplicada.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Implementar confirmação que resolve referências e aplica aberturas/alocações/dívidas numa transação local.
2. Persistir chave de idempotência vinculada a usuário e conteúdo; restrições únicas e controle de versão defendem concorrência.
3. Publicar efeitos externos/invalidação após commit; evitar cotação/rede externa dentro da transação.

## Aceite e testes adversariais

- [ ] Falha injetada no último item faz rollback integral; rascunho pode ser corrigido.
- [ ] Mesma chave/conteúdo após timeout retorna resultado anterior; chave com outro conteúdo falha sem duplicar.
- [ ] Duas conexões finalizando simultaneamente deixam uma única carteira/posição/dívida; totais coincidem com oracle.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Orquestrar vários cadastros pelo browser como garantia de atomicidade ou reaplicar abertura em conta legada.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-030/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

