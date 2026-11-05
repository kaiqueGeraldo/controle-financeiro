# Matriz prévia — diagnóstico dos dois timeouts

Base 2a22739b08b749a73b37224519ab6a3faf880ab3, branch codex/saneamento-pr3-expanded.
Candidato anterior a7f2256b; delta posterior somente documental. Produto/testes/CI:
860 arquivos, digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Runtime novo: componentes-timeout-20261103-01. Acervos antigos por referência.

Casos exatos:
- CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável
- compares conflict snapshots and does not silently choose the server

Mensagem bruta de ambos: Error: Test timed out in 5000ms..
Vitest 4.1.11; projeto/testes não configuram outro limite. Conferir default e
fronteira de medição no código instalado. Não há assertion de desempenho de 5 s
nesses casos; requisitos: ação de pagamento/80itens e comparação local/remota
sem escolha silenciosa. Não atribuir requisito de latência por associação.

Mesma imagem Linux por digest, Node efetivo/lock/timezone São Paulo e filesystem
Linux nativo. Overlays somente descartáveis: etapas, CPU/wall real capturados
antes de fake timers, renders, Intl/getComputedStyle; flush nativo após cleanup.
Hashes dos overlays são explícitos; resultados instrumentados são diagnósticos.

| Grupo | Execuções previstas | Seleção e limite |
|---|---|---|
| A |1 caso de fatura;1 de onboarding, processos novos |arquivo/filtro literais; watchdog5000; filtrados explícitos, sem alegar gate completo |
| B |arquivo de fatura completo; arquivo onboarding completo |todos os casos; ordem local/hooks/timers/cleanup |
| C |grupo único de 6 arquivos |2alvos + auth-settings-accessibility, cf026-contracts, cf015-recovery-expanded, rf15-causal; sobreposição documentada no relatório anterior |
| D condicional |mesmo C uma vez com maxWorkers2 |somente após evidência de contenção/pressão ou degradação CPU/wall; nenhuma serialização global |
| E condicional |um microprobe 20/40/80 |somente se A localizar render/seletores dominantes; probe separado não substitui teste80 |
| Correção/contraprova |mecanismo demonstrado + restauraçãoSHA256; controlesA/B/C corrigidos |não forçar timeout ou repetir até passar |
| Completo condicional |uma rodada de componentes626/71 após sustentação causal |auditor íntegro, zero omissões/skips; expanded somente depois de diagnóstico/inputs coerentes |

C usa sobreposição dos timestamps antigos; não presume ordem total de arquivos.
Separar watchdog do corpo, hooks/cleanup/import/transform e esperas assíncronas.

Por execução: argv/cwd/início/fim/exit, Node/lock/config/worker-PIDs, cpu.max/cpuset,
memória/PSI/cpu.stat/proc/carga e todas as durations/falhas. A/B/C verdes não
encerram a falha do conjunto. D/E dependem de informação nova. Ao fim da matriz,
classificar causa corrigida, defeito fora do escopo, orçamento a decidir ou causa
inconclusiva com próximo experimento específico. Sem investigação indefinida.

Sem alteração de infraestrutura persistente, guard, seleção, zoom, assertions ou
timeout inicial. Preparadores/observadores anteriores não são reabertos.


## Único complemento por informação nova

A/B/C e E passaram. O relatório anterior mostra pico de8 intervalos de arquivos,
enquanto C selecionou6 arquivos e mediu 6 workers. Para não confundir esse verde
com reprodução de carga equivalente, executar uma única seleção de 8 arquivos:
C + temporal-forms e onboarding/identity-remediation, ambos presentes no pico
anterior. Nenhum limite de workers muda. Este é o último experimento da matriz.
D (maxWorkers2) continua condicionado a pressão/contenção demonstrada; sem isso,
não executá-lo nem inferir causa a partir de serialização. Não ampliar para 626
ou expanded se não houver correção causal sustentada.
