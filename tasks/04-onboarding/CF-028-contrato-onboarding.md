# CF-028 — Finalizar contrato da entrevista inicial

- Estado: pronta
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-016](../03-integridade/CF-016-regras-financeiras.md), [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md)
- Origem: T-006, T-007; F-008; SPEC-001

## Prontidão independente restrita — 03/10/2026

**Apta a iniciar exclusivamente a especificação**, base `06c1a51`. [Decisão independente](../evidencias/revisao-CF-025-CF-027-RV24/README.md) confronta CF-016/018/019/020/023 e alterações posteriores. CF-016/018/020/023 conservam aceite próprio; CF-019 oferece dívida/parcelas/abertura e backend aceitos em J/C, suficientes para definir contrato/DTOs/validações do onboarding sem consumir a interação de pagamento120 investigada em RVA-03.

Liberação explícita de capacidade CF-019→CF-028, sem concluir CF-019 ou fechar RVA-03. Não há dependência direta criada de CF-025/026/027. Não implementada nem aprovada antecipadamente: todos os critérios abaixo permanecem pendentes. CF-029–034, finalização, UI, migração real e deploy não liberados por esta nota; protocolo/concorrência próprios do onboarding ainda serão especificados e validados nas tarefas correspondentes.

## Problema e resultado esperado

A entrevista já está especificada, mas deve usar o modelo financeiro corrigido. Fechar ambiguidades de dívida, alocação e usuário legado antes da implementação.

## Escopo e referências

- `docs/sdd/specs/001-onboarding.md`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `controle-financeiro-frontend/src/types/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Detalhar DTOs e schema de rascunho/finalização com exemplos válidos/inválidos, limites e erros por campo.
2. Definir versão/idempotência, carteira padrão e diferenciação entre novo usuário e complemento de usuário com dados.
3. Fixar fluxo ramificado com fatura/parcelas pendentes, metas vinculadas e progresso numérico inicial.

## Aceite e testes adversariais

- [ ] Exemplo completo reconcilia patrimônio/dívida/reservas e cada payload tem regra de validação.
- [ ] Reenvio após timeout, duas abas e alteração de fonte vinculada têm resultado determinado.
- [ ] Nenhuma etapa cria receita histórica, compra fictícia ou segundo saldo da carteira padrão.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Implementar UI antes do contrato ou ampliar para Roda da Vida/Presentes.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-028/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.
