# Startup: causa comprovada no harness e diagnóstico HQL parcial

Três casos da revisão, por nome exato:

- releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain(Path);
- readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart;
- enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect.

Na nova execução original, o segundo falhou por porta52317 ocupada, não por
esgotar40s. Logs mostram conexão/JPA/queries e depois cancelamento de contexto por
webServerStartStop. Os outros dois passaram. Durações JUnit incluem preparação,
mais de um processo em releasedProcess, probes e cleanup; não são tempos de boot.
Comando, XML e logs filhos preservados em execucao/, mapeados por origem em resultados.json.

## Corrida reproduzida e corrigida

App escolhia porta com ServerSocket(0), fechava a reserva e passava o número ao
processo. A reprodução abriu outro ServerSocket nessa porta antes do Tomcat;
processo saiu não zero com "Port ... already in use" em25,2s de teste. Isso
demonstra o TOCTOU no harness. Não identifica quem ocupou a porta da falha natural.

Correção mínima: server.port=0 nativo; publicação Docker127.0.0.1::8080. Descobrir
porta vinculada no log/daemon, sem reservar e liberar antes. Mantém HTTP real,
orçamento monotônico40s, connect1s/request8s, espera100ms e cleanup existentes.
Consulta Docker de mapeamento tem teto5s dentro da observação, não extensão do gate.
O loop original já podia terminar depois de40s por uma requisição em andamento;
nenhuma conclusão nova de orçamento estrito foi inventada.

Antes/depois causal: alocador antigo + listener concorrente falha; alocador novo
+ listener concorrente fica ready; reintrodução do antigo é detectada pela nova
regressão. Código restaurado por SHA90473fc6…83ef. Testes corrigidos PG16/JAR1,
PG17/JAR4 e PG17/imagem3 passaram em invocações distintas. Sem aumento de prazo.

## Instrumentação e configuração

JAR p05 SHA b2967058…31395b e imagem ID8c102183…568ef1, sem rebuild. Java21.0.12.1+1
nativo com -Xmx384m; imagem21.0.12+8 e heap padrão do container. PG17.11 já pronto,
schema migrado V1–V16 antes de t0, sem Flyway na API; adoption, writers=true,
jobs=false e JDBC connect/socket2s. Banco vazio não é cenário de readiness válido
para esse perfil; seu contrato de recusa já tem aceite e não foi convertido em
ensaio de desempenho. Sem instalação npm ou outra JVM de aplicação concorrente
nas duas observações; carga de outros programas do host não foi controlada.

Agent externo Byte Buddy1.17.8 temporizou forHql, createQuery e a criação real de
SimpleJpaQuery. Não trocou retorno, query ou validação; registra método/hash/tamanho,
sem texto de valores. Hibernate createQuery chama overloads aninhados; o analisador
conta só a chamada externa, sem somar duplicações artificiais. JFR profile acrescenta
amostras CPU, compilação, alocação, GC e classes. Agent/JFR podem mudar class loading,
JIT e duração; seus resultados não são comparação causal pura contra o gate original.
[API de agents consultada](https://github.com/raphw/byte-buddy), versão efetiva
conferida localmente por compilação/execução e hashes.

O observador registra40s separadamente e permite até90s somente para diagnóstico.
O wrapper JUnit1/1 informa que a observação terminou; não aprova estabilidade ou
percentis. Native ficou ready em23,215s, Linux21,137s. Nenhuma dessas rodadas
reproduziu o estouro HQL; os históricos Windows/Linux continuam preservados.

## Timeline desde criação do processo

| Marco | Nativo | Linux | Limite da medição |
|---|---:|---:|---|
| Processo | 0 | 0 | No Linux, criação do cliente Docker precede a JVM1 |
| Primeiro log de startup | 5,536s | 5,325s | Não é instante exato de criação da JVM; premain também registra relógios |
| Scan de29 repositories concluído | 8,702s | 7,612s | Scan não conclui preparação das queries |
| Tomcat inicializado | 10,523s | 8,814s | Ainda sem prontidão HTTP |
| Conexão Hikari adicionada | 12,195s | 10,529s | Banco acessível |
| JPA/EMF inicializado | 15,229s | 13,448s | Hibernate validate concluído no boot; não isola cada consulta de catálogo |
| Preparação HQL anunciada | 15,366s | 13,552s | Sequência completa nos eventos BOOT_QUERY |
| Tomcat started / porta vinculada | 22,823s | 20,579s | Porta descoberta pelo observador |
| Dispatcher no primeiro HTTP | 23,080s | 21,004s | Inicialização do servlet também tem custo |
| Readiness200 / liveness200 | 23,215s | 21,137s | DB pausado depois deu503/200; retorno200 no mesmo processo |

Timestamps de log nativo foram interpretados em São Paulo e da imagem em UTC;
probes usam nanoTime. Não subtrair fusos diferentes. Nenhum tempo isolado de
schema validation foi fabricado a partir do marcador de JPA.

## O que as novas amostras mostram

76 chamadas HQL,76 hashes distintos, nenhuma repetição: soma2,364/2,177s;
maior0,567/0,612s. As maiores dessa rodada são AccountRepository.findOwnedForAllocation
no nativo e TransactionRepository.sumReportByPeriod na imagem. Não se demonstrou
uma query isolada de40s ou repetição anormal nesta sequência. Validação Hibernate
externa somou1,293/1,156s; não corresponde ao tempo inteiro de criação dos beans.

JFR Linux válido,3.399.604 bytes, SHA486d1c84dff078eb2d526d8b8bb1a485dd2a3a9860f1dc4bdbf112b9383060ed.
360 amostras de execução;339 da main classificadas por frames:106 Spring Data HQL,
32 Hibernate HQL,28 ANTLR sem dono visível,83 class loading,38 do agent,3 JDBC e49
outras. São amostras com categorias heurísticas, não atribuição exata de milissegundos.
Há2848 amostras de alocação e65 eventos de compilação; não representam total exato
de bytes alocados.40 eventos de GC somam~520ms na gravação; main teve duas leituras
socket registradas somando~26,84ms e nenhum ThreadPark registrado. Thresholds e
janela limitada impedem inferir ausência universal de espera. CPU machineTotal
médio~0,202 e jvmUser~0,170, valores normalizados reportados pelo JFR; não são SLO
ou medida histórica de CPU livre.16 processadores foram observados pelo harness.

JFR print limita pilhas a5 frames por padrão: a extração inicial e a reextração
com64 frames foram preservadas. A gravação não foi repetida; a classificação foi
aprofundada. JFR nativo tem0 bytes: encerramento Windows não gravou dumponexit.
Não conta como gravação válida. Próxima observação deve fazer JFR.dump antes do
cleanup, preservando o impacto adicional e a gravação incompleta atual.

## Hipóteses e decisão

| Hipótese | Conclusão delimitada |
|---|---|
| Corrida da porta no harness | Demonstrada na falha nova e em reprodução; corrigida sem mexer no produto |
| Uma query HQL isolada ou repetição explica tudo | Não reproduzida nas76 chamadas reais; não exclui outras condições frias/JIT/carga |
| Espera longa SQL/GC explica a observação instrumentada | Dados capturados não mostram40s de espera/pausa; não extrapolar para os estouros antigos |
| Apenas Windows | Continua insuficiente: histórico inclui Linux; esta rodada não revisa esse fato |
| Agent prova causa do atraso | Não: ele altera execução e as duas observações ficaram rápidas |
| Corrigir queries/lazy ou ampliar40s agora | Não justificado; nenhum repository/query/validação foi alterado |

O40s surgiu no harness8605ea4; não foi encontrado SLO contratual correspondente.
Orçamento de teste, prontidão financeira e limite do provedor são decisões
separadas. Não alteramos40s nem usamos300s do Railway como dispensa.

Próximo experimento proposto: capturar uma ocorrência lenta com flush JFR nativo
antes do término, mesmos JAR/JDK/heap/config e CPU/memória/carga declaradas;
temporização de queries ligada à gravação, controle sem agent e observação longa
apenas diagnóstica. Medir frio/aquecido de forma controlada antes de propor novo
orçamento para revisão. Sem amostra suficiente para percentis, causa completa ou
otimização de produto. Startup integral continua não aprovado.
