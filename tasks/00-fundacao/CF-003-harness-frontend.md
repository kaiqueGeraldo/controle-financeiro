# CF-003 — Preparar testes de componente e navegador

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: nenhuma
- Origem: T-002, T-008, T-011; F-012, F-015

## Problema e resultado esperado

Falta infraestrutura para testar o comportamento de componentes e os fluxos pelo navegador. Preservar os testes Node de datas e ampliar as camadas sem duplicação.

## Escopo e referências

- `controle-financeiro-frontend/package.json`
- `controle-financeiro-frontend/package-lock.json`
- `controle-financeiro-frontend/scripts/`
- `controle-financeiro-frontend/tests/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Verificar compatibilidade e escolher/configurar testes de componente e Playwright; separar comandos unitário/componente/E2E.
2. Definir relógio, timezone, seed, autenticação sintética, viewport e artefatos de falha; iniciar/parar processos da suíte com limpeza.
3. Criar smoke de UI e um teste de componente com falha de validação real; integração backend será consumida pelas próximas tarefas.

## Aceite e testes adversariais

- [x] Um teste propositalmente incorreto falha e devolve exit code não zero; restaurar assertion ao final.
- [x] Componentes podem usar HTTP controlado; projeto E2E integrado não intercepta APIs internas para forçar sucesso.
- [x] Relatórios identificam fuso/viewport/seed; testes não usam credenciais reais ou sleeps arbitrários.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Escrever todos os fluxos E2E agora, mudar layout ou aprovar snapshots de telas ainda não revisadas.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 07/09/2026 e concluída em 08/09/2026 sobre `main` na base `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, preservando o patch local de CF-001/CF-002 e as correções anteriores. Foram adicionados comandos separados para unitário, componente e E2E, configuração Vitest/jsdom, Playwright em três viewports, relógio/fuso/seed explícitos, autenticação sintética, artefatos de falha e supervisor com limpeza da árvore Next.

A validação sobre `npm ci` aprovou 15 execuções unitárias, 1 teste de componente, 6 testes Playwright, typecheck, lint dos arquivos do harness e build. A mutação proposital falhou com código 1 e foi restaurada; o relógio falhou sem tolerância antes da correção por `setFixedTime`; o E2E não intercepta APIs internas e liberou a porta 3100. Evidência completa, comandos, falhas intermediárias e riscos (registro de execução privado).

Limitações: o lint global mantém o baseline de 70 erros/37 avisos sob responsabilidade da CF-026; o audit atual registra 12 vulnerabilidades, incluindo 3 altas no grafo de produção, sem atualização fora de escopo; o build dependeu de rede para Google Fonts; o BFF global registra 503 quando o backend sentinela está ausente; CI remoto e integração backend não foram executados. Nenhum teste foi ignorado, nenhuma tolerância foi ampliada e nenhum arquivo de produto foi alterado por esta tarefa.

Dependências: a CF-010 passa a ter sua única dependência satisfeita nesta base local. CF-005 e CF-008 ainda aguardam CF-004; CF-007 aguarda CF-005/CF-006; CF-009 aguarda CF-008. Nenhuma tarefa seguinte foi iniciada nem teve estado alterado.


## Revisão independente — 09/09/2026

R01 separa seleção do smoke e E2E integrado. Harness detecta falhas causais e mantém seus limites.

O parecer da revisão (registro de execução privado) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.
