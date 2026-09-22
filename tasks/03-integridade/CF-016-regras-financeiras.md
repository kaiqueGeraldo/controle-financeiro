# CF-016 — Especificar abertura, fluxo realizado, dívida e reservas

- Estado: concluida
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
- `docs/sdd/specs/004-regras-financeiras.md` (contrato normativo desta tarefa)
- `tasks/evidencias/CF-016/` (vetores sintéticos, verificação documental e confronto estático)
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Especificar regime dos relatórios: abertura, realizado, pendente, transferência, compra e pagamento de fatura.
2. Definir alocação de metas em contas/investimentos e diferença entre custo investido e valor atual; registrar compensações/estornos.
3. Decidir posição anual histórica versus seção atual explicitamente rotulada, com indisponibilidade quando histórico insuficiente.

## Aceite e testes adversariais

- [x] Tabela sintética reconcilia cada evento sem consultar função de produção para calcular expected.
- [x] Abertura não é renda; pendente não altera realizado; destino de meta não cria patrimônio; pagamento não repete compra.
- [x] Casos de saldo negativo, taxa, arredondamento e estorno têm regras consistentes ou decisão de produto explícita.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Reclassificar dados reais por descrição ou implementar ledger completo sem justificar necessidade.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 21/09/2026 sobre `45e156c3189fd9893a88e6adcc0df3903983f4b9`, com CF-001 e CF-004 concluídas e integradas. CF-015 permanece em_revisao exclusivamente pelo aceite de zoom nativo 200%; R03/RV01 encerrado. O [snapshot inicial](../evidencias/CF-016/base-inicial.json) registra os arquivos preexistentes, inclusive README raiz modificado. Escopo documental complementar: nova SPEC-004, referência no índice SDD/ADR-002 e atualização apenas das decisões DEC-04/07 na SPEC-003 para evitar contratos contraditórios. Nenhuma mudança de produto, schema ou estado de tarefa dependente.

Concluída em 22/09/2026 **no escopo de especificação**. A [SPEC-004](../../docs/sdd/specs/004-regras-financeiras.md) resolve DEC-04 e regras financeiras de DEC-07; define abertura, realizado/pendente, transferência, compra/pagamento, custo/avaliação, destinação, taxas, precisão e compensação. [Tabela e guia](../evidencias/CF-016/ORACLES.md): 49 estados reconciliados e 18 bordas contratuais, sem chamar cálculo de produção. [Confronto estático](../evidencias/CF-016/DIVERGENCIAS.md): 15 divergências/lacunas de produto com donos nas tarefas existentes, mais uma lacuna documental preexistente.

Validação documental: 49 estados aprovados em três fusos; precisão/custo/parcelas e compatibilidade com sete casos CF-001; seis mutações em memória rejeitadas; verificador CF-001 aprovado. O verificador antigo CF-004 falha por `UpdatePlanItemDTO.dueDate` ausente do inventário, com inputs idênticos à base 45e156c; registrado como D16-T01, atualização documental com CF-008, sem alterar dependência nem enfraquecer assertion. [Execuções e limites](../evidencias/CF-016/EXECUCOES.md).

Nenhuma regra de produto foi implementada/certificada. Sem PostgreSQL, HTTP, E2E, visual ou revisão independente nesta execução; essas provas continuam nas tarefas donas. DEC-03 permanece CF-019; detalhe de protocolo/recibo durável, CF-024; proveniência/migração, CF-017. CF-015 e zoom pendente preservados; CF-017 não iniciada, README e alterações alheias intactos. Sem stage/commit/push/deploy ou banco real. Os critérios assinalados atestam os entregáveis da especificação, não conformidade financeira do runtime.
