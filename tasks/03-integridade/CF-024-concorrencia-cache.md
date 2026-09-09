# CF-024 — Corrigir concorrência financeira e cache após commit

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md)
- Origem: T-009; F-007

## Problema e resultado esperado

Transações e @Version existem, mas não há evidência de que chamadas simultâneas, retry e cache preservam dinheiro e resultado visível.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/listener/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar concorrência real com transações/conexões separadas e barreiras determinísticas, não duas chamadas sequenciais.
2. Cobrir pagamento, transferência, venda e aporte sobre a mesma fonte; testar rollback, eventos e invalidação após commit.
3. Tratar conflito com resposta recuperável e documentar idempotência/locks necessários, custo e risco de deadlock.

## Aceite e testes adversariais

- [ ] Duas escritas não perdem saldo nem duplicam débito; conflito/retry produz resultado explícito e testado.
- [ ] Cache não publica resultado que fez rollback e não permanece desatualizado após commit.
- [ ] Teste observa banco após ambas as transações; remover proteção crítica faz assertion de integridade falhar.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Usar sleep como sincronização ou serializar testes para esconder corrida; lock global sem medir impacto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-024/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

