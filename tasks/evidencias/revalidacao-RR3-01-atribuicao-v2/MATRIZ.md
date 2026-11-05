# Matriz de provas

Contagens por camada; há sobreposição de comportamento entre elas. Reexecuções de restauração não são novos cenários. Todos os esperados vêm dos contratos/probes históricos ou das fixtures explícitas independentes.

| Camada | Resultado | O que sustenta |
|---|---:|---|
| Suite do candidato | 42/42, zero skip/flaky/retry | 24 controles anteriores e 18 novos |
| Probe geometry original | 10/10 | Visível/identidade/oclusão/clipping/filtro/cobertura |
| Probe independente anterior | 21/21 | Positivos, dois residuais por presença de style, interrupções/estado |
| Probe original de valor de style | 3/3 | Positivo, invisível sem reação, residual por valor preexistente |
| Complementos originais | 4/4 | Fonte pendente, timeout e continuidade, substituição, animação tardia |
| Novas fixtures independentes | 14/14 | Range, referência, isolamento, erros, match parcial e texto vizinho |
| Demonstração Highlight | passou | API pode criar visibilidade em B; helper transparente recusa |
| Consumidor SAN-E2 | 1 caso, três larguras | 360/768/1440×900, recibos painted |
| Probe real original | 1 caso, quatro estados | baseline/filtro/cobertura/restauração e persistência após reload |
| Contratos CI | 32/32 | Zero falha/skip |
| Tipagem e lint dirigido | exit 0 / exit 0 | Mesma configuração e regras do candidato |

## Os 18 novos controles do candidato

Todos estão em text-paint.observer.spec.ts; nomes/linhas/resultado exatos também constam em RESULTADOS.json.suite42.new18 e cases.

1. rejects background-presence
2. rejects other-text-B
3. rejects background-value
4. rejects other-text-original
5. visible text on legitimate gradient
6. independently rendered multiline text
7. preserves attributes, sheets and registry and records the independent mask
8. cleans its highlight after interrupted capture 1
9. cleans its highlight after interrupted capture 2
10. cleans its highlight after interrupted capture 3
11. cloning during capture cannot copy a transient inline mask
12. unsupported editable reference is inconclusive
13. unrelated background during B cannot satisfy attribution
14. independent raster contract glyph
15. independent raster contract rectangle
16. independent raster contract reverse
17. foreign canvas in the text region is inconclusive
18. preserves preexisting highlight ownership when inconclusive

## As 14 fixtures independentes novas

| Fixture | Esperado e observado |
|---|---|
| nested-full-range | painted; três ranges completos somente do alvo |
| substring-identity | identity; zero capturas |
| partial-selection | existing-text-highlight; seleção igual, seguimento positivo |
| scale-transform | font-metrics-reference; zero capturas |
| mixed-fill | mixed-fill; zero capturas |
| unsupported-text-transform | unsupported-text-rendering; zero capturas |
| preexisting-adopted-sheet | painted; mesma folha preexistente |
| foreign-resources-during-mask | painted; preserva objeto/folha alheios, recusa próxima chamada até remoção pela fixture |
| api-unavailable | highlight-api-unavailable; zero capturas |
| invalid-png | exceção de decode; limpeza, seguimento positivo e botão funcional |
| invalid-dimensions | unstable-paint/no-glyph-paint; limpeza e seguimento positivo |
| last-word-covered | no-glyph-paint/ambiguous-glyph-paint; núcleos sem contribuição |
| same-text-visible-decoy | no-glyph-paint/ambiguous-glyph-paint |
| concurrent-refusal | segunda chamada recusada; primeira painted |

O primeiro ensaio dessas fixtures teve 12/14: dois problemas do harness, preservados em novos/results.json e no script arquivado. Um diagnóstico de concorrência foi escrito com nome incorreto; uppercase ativou duas guardas, sendo a última font-metrics-reference. A versão final usa o diagnóstico declarado e capitalize sobre Custo, que mantém as métricas para isolar a guarda de renderização. Mantidas rejeição, zero capturas e ausência de aprovação. Nenhuma assertion histórica ou do candidato, timeout/retry, limiar ou implementação foi alterado. Não se contam esses ensaios como 28 cenários.

## Contraprovas

| Isolamento | Falha esperada observada | Restauração e controles |
|---|---|---|
| Observador anterior da base | Exatamente os dois falsos aceites de presença e o de valor; exit 1 por assertions | Helper restaurado por SHA; cinco controles focados passam |
| Silhueta desativada | Retângulo devolve 0 pixels externos em vez de 55; teste falha | Módulo restaurado por SHA; três contratos raster passam |
| Direção desativada | Pixel preto somente em B vira contribuição; wrongDirection=0, unmatchedCore=0, glyphPixels=[1]; assertion falha | Módulo restaurado por SHA; direção correta recusa e oito controles finais passam |

Zoom: zero execuções novas; dois cenários obrigatórios pendentes. Expanded integral: sem novo certificado.
