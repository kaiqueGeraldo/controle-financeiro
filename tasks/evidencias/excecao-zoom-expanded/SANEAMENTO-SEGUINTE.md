# Saneamentos delimitados necessários — gate reprovado

Inputs: 4204080aa9b2fa46c52f9d1ef6638b77231087fd, digest 310680d084a72cebd66e01fd400c79f5eeeac1d0639cb5c281f5d3a187183164. Nenhuma exceção adicional, alteração de timeout, retry, assertion, dependência ou produto foi aplicada para absorver estas ocorrências.

## EXZ-ENV-01 — build Windows com raiz mapeada

Primeira ocorrência: frontend/build.log e result.json no runtime excecao-zoom-expanded-20261103-01. npm ci/lint/tipagem, 18 unitários e 626 componentes passaram; Next 16.1.6/Turbopack recusou depender do eslint.config.mjs no caminho físico C: por estar fora da raiz Z:. Classificação: ambiente/topologia do runtime suplementar Windows, sustentada pelo erro explícito de caminhos. Não é defeito financeiro nem prova de zoom. Preservado sem reexecução. Um saneamento futuro deve empregar topologia coerente por caminho físico, sem alterar produto ou afrouxar a restrição do compilador; runtime novo, hipótese/contraprova dirigidas e gate próprio. O workflow original exige Windows nativo específico, não o frontend Windows suplementar; o resultado não substitui a matriz Linux.

## EXZ-INC-02 — componentes Linux incompletos com exit 1

Primeira ocorrência: linux/expanded/result.json, components.json, components.log, linux/controller.log e execution.json. Controlador/JVM preparados em Linux Docker local, Node 24.18.0 e JDK21. Os 39 contratos passaram; instalação/lint/tipagem e 18 unitários passaram. O processo de componentes terminou com exit 1, mas JSON success=true, 597 passes e zero falhas/skips relatados em 63 arquivos. Windows registra 626 testes em 71 arquivos. Diferença por identidade: 29 testes de oito arquivos, detalhados em PENDENCIAS.json e no recibo privado linux/component-diagnosis.json. Os arquivos pertencem aos inputs copiados; não foram excluídos pela DEC-ZOOM-05.

Classificação: **inconclusivo, com diagnóstico a delimitar entre harness/ambiente**. Não atribuir causa a produto, CPU, IO, pool, timeout ou versão npm sem prova. O resumo JSON parcial não neutraliza exit 1 nem certifica os testes ausentes. Nenhuma repetição da suíte foi feita para obter verde.

Próximo lote: conferir descoberta por identidade independentemente da execução, bytes das fontes, configuração/pacotes e saída dos workers; preservar stderr e detalhes do runner em runtime novo antes de encerrá-lo. Formular hipótese observável a partir disso e contraprovar somente o mecanismo demonstrado. Não excluir os oito arquivos/29 testes, aceitar skips ou aumentar timeouts/retries. Após saneamento e revisão correspondentes, executar todos os gates no candidato correto.

## Continuidade

O all Linux parou corretamente em componentes. Build/browser-install Linux, 115 classes backend Linux, 23 jornadas RF15 obrigatórias reais, E2E financeiro completo e pacote não foram alcançados. PostgreSQL e aplicação Spring de teste não chegaram a iniciar nesta rodada. Não forçar etapas sucessoras como aprovação, produzir pacote ou reaproveitar markers antigos. As 116 identidades Java esperadas estão em CONJUNTOS-A-B-C.json; Windows nativo executou sua única classe e passou.

A implementação da exceção pode ser examinada independentemente, com seus contratos e provas sintéticas. Este lote não está pronto para atualização remota da PR, integração ou declaração de expanded aprovada. DEC-ZOOM-05 permanece exatamente com dois adiamentos. RR3-01 e demais aceites anteriores não foram reabertos. Sem pedido adicional de intervenção humana para zoom neste lote.
