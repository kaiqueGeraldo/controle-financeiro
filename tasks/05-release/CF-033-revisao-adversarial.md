# CF-033 — Revisar integridade, testes e comportamento final

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-025](../03-integridade/CF-025-consultas-desempenho.md), [CF-027](../03-integridade/CF-027-fronteiras-backend.md), [CF-032](../04-onboarding/CF-032-e2e-financeiro.md)
- Origem: T-009, T-011; todos os riscos críticos

## Problema e resultado esperado

Revisão final deve procurar defeitos e lacunas nos testes usando os requisitos, sem aceitar a conclusão do implementador como evidência suficiente.

## Escopo e referências

- `docs/sdd/`
- `tasks/evidencias/`
- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Confrontar requisitos/paridade com código e testes; executar casos novos de arredondamento, concorrência, sessão e fuso.
2. Aplicar mutações controladas em cópia isolada em filtro de realizado, ownerId, parcela e idempotência; verificar detecção/restauração.
3. Consolidar defeitos residuais por severidade e tarefas de correção; repetir apenas verificações impactadas após correção.

## Aceite e testes adversariais

- [ ] Todos os critérios críticos têm teste eficaz ou bloqueio explícito de liberação.
- [ ] Mutações plausíveis são detectadas pelos testes certos; sobrevivente é analisado, não ocultado por meta de cobertura.
- [ ] Relatório deixa claros cenários não executados e riscos; P0/P1 de uso diário pendente impede aprovação.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Aprovar por contagem de testes, alterar expected para aceitar resultado atual ou prometer ausência absoluta de bugs.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-033/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

