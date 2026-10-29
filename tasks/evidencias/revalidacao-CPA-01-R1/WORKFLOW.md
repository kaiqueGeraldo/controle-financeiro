# Workflow real: contrato, semântica e limites

## Estrutura conferida

YAML completo parseado com js-yaml4.1.1 já instalado, sem dependência adicionada.
Eventos/filtros e permissions são iguais à base e837: push/main e PR/main, paths
backend/frontend/.github/tasks/docs-sdd; dispatch choice smoke/expanded, default
smoke. Dispatch pode selecionar a branch quando o workflow existe na default
branch. Push da branch codex não dispara este workflow; PR elegível é a próxima
entrada usual. Não se presume qualquer integração externa atual.

| Job | Condição / needs | Papel |
|---|---|---|
| windows-native | Sem if de evento; sem needs | Windows15min, contrato TCP; sem pacote |
| linux | Sem if; needs windows-native | Ubuntu45min, frontend/backend/E2E/package e upload de pacote verificado |
| expanded | dispatch e suite==expanded; needs linux | Ubuntu45min, matriz expanded; diagnóstico |
| required | always; needs windows-native,linux,expanded | Ubuntu5min; checkout/setup/avaliador,1min por etapa |

Comparação de objetos parseados: Windows e Linux são idênticos aos workers da
base, descontada apenas a inclusão de required.test.mjs no comando de contratos;
expanded muda somente needs de required para linux. DAG sem ciclos. O agregador
mantém ID required, sem name/matrix; workflow CI integrated gates. Nome/rótulo
declarado esperado: required / CI integrated gates / required. A identidade e
exigência efetivas do check serão verificadas no remoto em etapa autorizada.

## Por que a rejeição determina o resultado

O último passo de required executa exatamente `node .github/scripts/required.mjs`.
NEEDS_JSON recebe `toJSON(needs)` por env, sem interpolação em shell; CF_REQUIRED_SUITE
recebe inputs.suite e GITHUB_EVENT_NAME é o evento da plataforma. O módulo valida
modo, JSON, objeto raiz, jobs e result, e rejeita status fora do conjunto literal.
O CLI define process.exitCode=1 para qualquer rejeição. Comando posterior,
continue-on-error e exceção convertida em sucesso não existem. Falha anterior de
checkout/setup também impede sucesso do job.

Diagnóstico usa IDs esperados e status conhecidos, substituindo valores arbitrários
por unknown result; não imprime outputs, payload ou valor desconhecido. Sentinelas
sintéticas com metacaracteres e quebra de linha não escaparam no CLI real. Código
não executa shell a partir dos dados. O conjunto pequeno de jobs torna avaliação
O(bytes do JSON + chaves), com3 verificações fixas. A allowlist falha de forma
conservadora se o DAG mudar: novo job/mode exige atualizar contrato e testes.

## Pacote e trade-offs

Needs implícito de sucesso mantém Linux atrás de Windows; ci.mjs não mudou e
aguarda cada estágio antes do próximo. Gates estritos de relatórios e de source
digest/manifesto continuam anteriores ao artifact. O agregador não altera esse
caminho nem produz pacote. Upload de diagnóstico always não é upload de pacote.
Falha de testes/gates Linux impede exportar pacote aprovado; o verify Maven pode
ter criado um JAR intermediário antes de um gate posterior falhar, sem certificá-lo.

Executar Windows antes de Linux conserva a barreira e soma sua latência ao
caminho crítico. O agregador acrescenta checkout/setup e depende de rede/runner;
timeouts limitam espera, sem garantir disponibilidade. Esses custos são proporcionais
ao contrato e não justificam reordenar ou paralelizar o pacote nesta revisão.
Expanded pode falhar após artifact smoke existir; required reprovado impede
interpretá-lo como integração aprovada. Não se exige que esse artifact espere
expanded, pois isso seria mudar o contrato. Artifact CI, gate agregado e deploy
permanecem decisões diferentes.

## Fontes oficiais e fronteira da prova

Needs normalmente propaga falha/skip; uma condição always no job permite
executá-lo após dependências terminarem sem sucesso. Esta é a inferência de
elegibilidade aplicada ao YAML, não uma execução do scheduler.
[GitHub: jobs e dependências](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs).

O contexto needs fornece resultados das dependências diretas; inputs pertence ao
dispatch/reusable workflow. Ambos os usos são coerentes com o avaliador.
[GitHub: contextos](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts).
Inputs omitidos na chamada manual/API usam defaults do workflow; por isso ausência
na chamada resolve smoke, enquanto um CLI artificial sem valor efetivo é inválido.
[GitHub: execução manual](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow?tool=cli).

Always não garante sobrevivência a cancelamento forçado, runner perdido ou falha
da plataforma. Cancelamento pode interromper etapas/infraestrutura; o limite
operacional exige conferir resultado real e não aceitar check ausente/skipped como
aprovação de execução obrigatória.
[GitHub: cancelamento](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation),
[GitHub: force cancel](https://docs.github.com/en/rest/actions/workflow-runs#force-cancel-a-workflow-run).

Executado localmente: módulo/CLI, contratos/probes, mutações e restauração.
Conferido estaticamente: DAG, condições, env, identidade declarada e pacote.
Semântica acima: documentação pública oficial. Ainda depende de Actions: scheduler,
runner resolvido, resultados efetivos, uploads, cancelamento e check exigido.
Nenhuma configuração remota do repositório foi consultada ou alterada.
