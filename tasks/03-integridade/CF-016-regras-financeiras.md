# CF-016 — Especificar abertura, fluxo realizado, dívida e reservas

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-001](../00-fundacao/CF-001-criterios-e-oracles.md), [CF-004](../01-datas-integracao/CF-004-contrato-temporal.md)
- Origem: T-004; F-009, F-010

## Problema e resultado esperado

Saldo inicial tratado como receita e destinação de metas podem distorcer desempenho/patrimônio. Definir invariantes e exemplos independentes antes de mudar persistência.

## Escopo e referências

- `docs/sdd/arquitetura.md`
- `docs/sdd/specs/001-onboarding.md`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Especificar regime dos relatórios: abertura, realizado, pendente, transferência, compra e pagamento de fatura.
2. Definir alocação de metas em contas/investimentos e diferença entre custo investido e valor atual; registrar compensações/estornos.
3. Decidir posição anual histórica versus seção atual explicitamente rotulada, com indisponibilidade quando histórico insuficiente.

## Aceite e testes adversariais

- [ ] Tabela sintética reconcilia cada evento sem consultar função de produção para calcular expected.
- [ ] Abertura não é renda; pendente não altera realizado; destino de meta não cria patrimônio; pagamento não repete compra.
- [ ] Casos de saldo negativo, taxa, arredondamento e estorno têm regras consistentes ou decisão de produto explícita.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Reclassificar dados reais por descrição ou implementar ledger completo sem justificar necessidade.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-016/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

