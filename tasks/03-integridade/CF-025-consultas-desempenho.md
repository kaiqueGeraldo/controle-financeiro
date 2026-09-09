# CF-025 — Medir e corrigir N+1 e consultas ineficientes

- Estado: proposta
- Prioridade: P2
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-021](../03-integridade/CF-021-relatorios.md), [CF-022](../03-integridade/CF-022-habitos-crons.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md)
- Origem: T-009; F-013

## Problema e resultado esperado

Há busca por item na reordenação e risco de carregamento de coleções. Otimizar somente depois de medir comportamento real do banco.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/AccountService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Registrar contagem SQL, dataset, p95 e EXPLAIN de extrato/agregados/listas/reorder antes da alteração.
2. Substituir consultas por item quando comprovadas, revisar índices e predicados de datas; preservar paginação e posse.
3. Explicar Big-O antes/depois: round trips de reorder, leitura de coleções e sorting; separar memória de latência SQL.

## Aceite e testes adversariais

- [ ] Datasets crescente/pequeno mostram contagem de consultas sem N+1 nas rotas corrigidas.
- [ ] Projeção/fetch join não duplica linhas nem quebra limites/paginação; valores permanecem conciliados.
- [ ] Comparação reproduzível confirma benefício sem piorar isolamento, lock ou carga de memória.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Adicionar cache distribuído, índices ou fetch join de coleção paginada sem evidência.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-025/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

