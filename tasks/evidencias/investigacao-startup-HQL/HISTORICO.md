# Reconstrução das ocorrências

Foram lidos novamente os XMLs originais, logs UUID de cada filho e dumps, com
caminhos/SHA em [historico-verificado.json](historico-verificado.json). O
[complemento](historico-complemento.json) conserva também os dois BindException
pós-readiness e o controle mutante Linux que parou no startup. Sem rerun histórico.

Aliases de métodos abaixo são só abreviações da tabela; nomes completos estão
nos recibos: released=releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain,
db=readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart,
jobs=enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect,
maintenance=maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects.

| Execução | Caso | JUnit s | PID API | Primeiro log Spring | JPA concluído | Ponto da falha |
|---|---|---:|---:|---|---|---|
| p03/classes | jobs | 41,830 | 26180 | 26/10 15:35:00.670 | 15:35:23.048 | readiness40s, pré-bind |
| p05/JAR | released | 45,035 | 25924 | 26/10 16:08:29.365 | 16:08:53.703 | readiness40s, pré-bind |
| p05/JAR | db | 43,344 | 21052 | 26/10 16:09:13.470 | 16:09:33.740 | readiness40s, pré-bind |
| p05/JAR | maintenance | 43,257 | 26052 | 26/10 16:09:55.298 | 16:10:15.102 | liveness40s, pré-bind |
| p04/imagem witness | db | 67,029 | 1 | 26/10 19:37:34.004 | 19:38:00.838 | readiness40s, pré-bind |
| p04/imagem witness | maintenance | 58,502 | 1 | 26/10 19:38:35.558 | 19:39:03.266 | liveness40s, pré-bind |
| revisão original17 | released | 49,411 | 47912 | 26/10 20:23:20.791 | 20:23:43.800 | readiness40s, pré-bind |
| revisão original17 | db | 43,016 | 58044 | 26/10 20:24:02.544 | 20:24:22.519 | readiness40s, pré-bind |
| revisão original17 | jobs | 43,391 | 42124 | 26/10 20:26:48.001 | 20:27:10.011 | readiness40s, pré-bind |
| saneamento-startup-01 | db | 32,906 | 43076 | 26/10 21:30:58.412 | 21:31:15.238 | API falhou bind52317 |
| tcp-nativo/PG16 | ownedListenerEndsWhileUnrelatedReadyServiceSurvives | 55,291 | 61124 | 28/10 09:34:41.109 | 09:35:11.628 | readiness40s, pré-bind |
| tcp-nativo/PG16 | occupiedExplicitPortDoesNotAcceptUnrelatedReadiness | 44,983 | 56332 | 28/10 09:35:25.579 | 09:35:49.666 | readiness40s, pré-bind |

Timestamps impressos: São Paulo no Windows; UTC nas imagens. JUnit inclui
preparação e cleanup, não mede bootstrap. A revisão original17 tem3 falhas/zero
erros/skips; p05/JAR também teve3, mas o terceiro caso era maintenance/liveness.
P05/imagem passou17/17 e witness Linux posterior falhou2: preservar ambos,
sem somar invocações sobrepostas ou escolher somente a rodada verde.

## Inputs, comandos e campos que faltam

P03 executou classes, Java21.0.12.1+1 e heap384m, não o JAR p05; não há hash
binário retrospectivo confiável de suas classes nesta reconstrução. Demais
casos JAR usam p05 b2967058…31395b/inputs24844b5; Java21.0.12.1+1 -Xmx384m.
Imagem local8c102183…568ef1 contém o mesmo JAR, Java21.0.12+8, heap ergonômico,
sem limite explícito de CPU/memória da API. Boot/Data4.0.2, Hibernate7.2.1.Final,
ANTLR4.13.2 e pgjdbc42.7.9, sem upgrade nesta execução.

API nativa: java -Xmx384m -jar <p05/package/api.jar> mais adoption, porta e flags;
sem -jar em p03/classes. Imagem: docker run --rm, env sintética, imagem local e
argumentos adoption. Comandos Maven, seleções exatas, propriedades JVM e caminhos
de cada invocação estão nos XMLs/logs vinculados e nos COMANDOS dos pareceres
[original](../revisao-preparacao-local-adocao/COMANDOS.md),
[saneamento](../saneamento-preparacao-local-adocao/COMANDOS.md) e
[TCP](../investigacao-TCP-reuso-nativo/COMANDOS.md). Os históricos antigos usavam
porta explícita; o grupo TCP já usa porta0. Não reconstruir argumentos omitidos
pelos logs como se fossem comandos literais capturados.

PG17.11 nos grupos17; schema sintético UUID migrado antes do processo, adoption
Flywayfalse/ORMvalidate. Writers=true nos casos released/db/jobs, jobs=true só
no caso jobs; maintenance writers=false/jobs=false. Endpoints completos são
/ops/health/readiness e /ops/health/liveness. O modo PG16 do diagnóstico TCP
consta nos argumentos de seu recibo e no log do servidor, sem transferir a major17.

Criação exata/entrada no gate, exit espontâneo, CPU livre/RSS/GC por ocorrência,
I/O e recursos disponíveis antigos não foram capturados. Docker observado na
revisão tinha16 CPUs/16.623.751.168B; não mede capacidade livre histórica do
Windows. npm ci offline sobrepôs parte do original17, e jcmd acrescentou custo:
fatores de carga, sem prova causal. Os logs de processo terminam no cleanup,
logo não mostram quanto faltaria para readiness. Não preencher lacunas por resumo.

## Separação causal de TCP e HQL

Os2 erros antigos porta-pg16/17 são BindException na linha32 **depois** de
readiness e término: PID66060/porta54538 e PID19268/59466. Mecanismo equivalente
de liberação TCP foi aceito; sua atribuição exclusiva a cada tupla antiga não
foi inventada. O bind52317 no saneamento é a corrida anterior de reserva/liberação
da porta da API, também saneada e aceita em seu alcance. Essas classes são
distintas dos estouros pré-bind acima e não explicam todos eles.

Das8 tentativas antigas de dump,6 têm main válida e2 falharam no attach. No
PID47912 a35,16s, main RUNNABLE com CPU28.812,5ms: ANTLR → parser HQL de
**Spring Data** → JpaQueryEnhancer → SimpleJpaQuery → bootstrap de repositories.
Conexão/JPA já concluídos. Isso localiza trabalho ativo, não prova query
individual de40s, N+1, defeito Hibernate ou causa de todo o tempo. Pilhas completas,
incluindo as2 falhas de attach, conservadas e rehashadas; sem reabrir o aceite TCP.
