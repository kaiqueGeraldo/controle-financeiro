# Matriz independente de critérios

## Tabela de modos, definida pelo requisito e pelas condições do YAML

| Evento / input efetivo | Windows | Linux | expanded | Aprovação |
|---|---|---|---|---|
| push / inputs indisponíveis | success | success | skipped | Sim |
| pull_request / inputs indisponíveis | success | success | skipped | Sim |
| dispatch smoke | success | success | skipped | Sim |
| dispatch expanded | success | success | success | Sim |
| dispatch sem input na chamada, default do YAML aplicado | success | success | skipped | Sim, modo smoke |
| dispatch sem valor efetivo/default não aplicado ao CLI | Qualquer | Qualquer | Qualquer | Não: modo inválido |
| Input inválido/evento desconhecido | Qualquer | Qualquer | Qualquer | Não |

Nas três primeiras linhas, expanded deve constar skipped; success/failure/cancelled,
resultado ausente ou job omitido não são não aplicabilidade. Windows/Linux skipped
nunca são aceitos. A exceção expanded não é generalizada para os jobs obrigatórios.
No dispatch expanded todos os três precisam success. Em qualquer modo, obrigatório
failure/cancelled/skipped/ausente/desconhecido reprova. JSON vazio/malformado,
raiz não objeto, arrays, job inesperado e tipos inválidos também reprovam.

O default smoke pertence à resolução de inputs da plataforma; o CLI recebe o
valor efetivo em CF_REQUIRED_SUITE. Nos eventos sem inputs a expressão resulta
vazia. Aceitar smoke nesses eventos é equivalente ao conjunto declarado; expanded
é rejeitado e não altera os jobs executados. Não há fallback silencioso de dispatch
inválido para smoke.

## Critério → prova → conclusão

| Critério | Prova independente | Resultado |
|---|---|---|
| Conjunção de resultados, inclusive falhas combinadas | Produto cartesiano4 modos×5³ resultados, tabela literal; módulo real |500 decisões corretas,4 aprovações |
| Campos obrigatórios e parsing | Cada um dos3 jobs ausente, result ausente, tipos inválidos; JSON/escalars/arrays/extra | Rejeição |
| Default e modo expanded coerentes | YAML completo parseado, condição literal, default smoke e modos inválidos | Coerente |
| Propagação e diagnóstico CLI | Executável Node real, shell:false;4 sucessos,24 rejeições W/L,4 entradas inválidas e1 sentinela hostil | Exit0/1 correto, sem payload exposto |
| Agregador independente do sucesso de needs | if always,3 needs diretos, comando final, env e ausência de continue-on-error | Estrutura aceita, scheduler remoto pendente |
| Pacote preservado | Comparação estrutural workers com e837; sequência ci.mjs e upload inalterados | Windows/Linux bloqueiam pacote, agregado não o libera |
| Cobertura aceita | Identidades congeladas da revisão anterior e7 probes originais |100/115 Linux;101/116 união;15 históricos |
| Preservação |92 hashes protegidos;157 inputs copiados/restaurados;19 referências anteriores | Conferidos |

## Contraprovas em cópia isolada

| Mutação | Falha observada nos6 controles independentes | Restauração |
|---|---|---|
| Retirar always do agregador |1 assertion falhou | Hash original;6/6 |
| Aprovar incondicionalmente |4 controles falharam | Hash original;6/6 |
| Aceitar skipped obrigatório |2 controles falharam | Hash original;6/6 |
| Omitir Windows na política e no needs |5 controles falharam | Hashes originais;6/6 |
| Job ausente tratado como sucesso |2 controles falharam | Hash original;6/6 |
| Resultado ausente tratado como sucesso |1 controle falhou | Hash original;6/6 |
| Interpretar expanded como smoke |2 controles falharam | Hash original;6/6 |

Não foram modificadas assertions para acomodar o candidato. O primeiro controle
detecta falha por estrutura YAML; não é simulação executada do scheduler. Os demais
executam o avaliador mutado.32 contratos passaram após restauração de todos os inputs.
As sete mutações desta revisão ampliam as seis recebidas, sem somar contagens como
se fossem defeitos distintos ou prova exaustiva de ausência de bugs.
