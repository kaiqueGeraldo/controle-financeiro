# Fases, HQL, recursos e limitações

Uma tentativa por cenário, sequência fixada antes de executar: nativo controle,
imagem controle, nativo instrumentado, imagem instrumentada. Não se repetiu
inicialização nem se gerou carga para forçar timeout. Todo resultado em
[resultados.json](resultados.json), observações/logs em [execucao](execucao/).

## Linha do tempo desde criação

Valores em segundos; logs correlacionados a Instant UTC da criação, São Paulo
no nativo e UTC na imagem. Sucesso e gate medidos por nanoTime. Logs fornecem
marcos aproximados; não são spans monotônicos exclusivos de cada subsistema.

| Marco | Nativo controle | Imagem controle | Nativo agent/JFR | Imagem agent/JFR |
|---|---:|---:|---:|---:|
| Primeiro Spring log | 2,326 | 1,884 | 4,770 | 5,177 |
| Scan29 interfaces concluído | 4,462 | 3,672 | 7,331 | 7,292 |
| Tomcat inicializado | 5,924 | 4,709 | 8,873 | 8,621 |
| Hikari conexão adicionada | 8,035 | 6,044 | 10,592 | 10,374 |
| JPA/validate concluído | 12,395 | 8,220 | 13,223 | 12,944 |
| Anúncio de preparação HQL | 12,559 | 8,293 | 13,333 | 13,027 |
| Tomcat started/porta anunciada | 18,586 | 13,343 | 19,370 | 18,209 |
| Spring Started | 18,594 | 13,356 | 19,375 | 18,220 |
| Dispatcher no primeiro GET | 18,824 | 13,737 | 19,565 | 18,569 |
| Readiness200 | **18,925** | **13,824** | **19,652** | **18,669** |
| Liveness200 observado depois | 18,930 | 13,831 | 19,657 | 18,677 |
| JPA→porta anunciada | 6,191 | 5,123 | 6,147 | 5,265 |
| Porta anunciada→readiness | 0,339 | 0,481 | 0,282 | 0,460 |
| Cleanup confirmado, duração | 3,366 | 0,599 | 2,075 | 0,529 |

Schema V1–V16 e banco pronto antes de t0. Não foi inventada duração separada de
validate: está dentro de EMF/JPA. Scan das29 interfaces não é fim da criação/
validação dos repositories. Porta anunciada é limite superior do bind real;
o polling de descoberta pode acrescentar atraso. O primeiro liveness foi consultado
depois de readiness: esses números não afirmam que liveness só surgiu depois.
O GET funcional401 verifica a fronteira HTTP/security, sem escrita ou jornada.

Identidade: PID nativo do log igual ao Process lançado (64032/45364); imagem
JVM1 vinculada a nome UUID criado pelo App e cliente Docker46352/50356. Portas
dinâmicas53120/60421/53124/64885, vindas do listener/daemon. O observador não aceita
resposta de porta reservada/solta. Não houve fotografia kernel do primeiro bind;
o vínculo Process/log/container é a prova usada, com cleanup TCP canônico.

## Trabalho HQL localizado

O agent anterior, fonte985c8491…e106, mede JpaQueryEnhancer.forHql de Spring Data
e AbstractSharedSessionContract.createQuery de Hibernate; construtor SimpleJpaQuery
identifica o método. Overloads createQuery aninhados entram na pilha, mas só a
chamada externa é somada. Não se soma filho e pai como trabalho duplicado.

| Medida | Nativo instrumentado | Imagem instrumentada |
|---|---:|---:|
| forHql externos / hashes distintos | 76/76 | 76/76 |
| Tempo somado forHql | 2.044,406ms | 1.680,014ms |
| Maior forHql | 831,853ms | 474,889ms |
| Hibernate createQuery externo | 76 | 76 |
| Tempo somado de validação | 947,364ms | 878,588ms |
| Pausas GC registradas | 395,552ms | 362,603ms |
| Main SocketRead registrado | 11,102ms/1 evento | 11,718ms/1 evento |
| Main ThreadPark/MonitorEnter registrados | 0/0 | 0/0 |

Maior query nativa: AccountRepository.sumTotalBalanceByUserId,75 caracteres,
hash857c9267…bbd1d3; é a primeira HQL dessa sequência. Na imagem, maior é
TransactionRepository.sumReportByPeriod,1808 caracteres, hashf746b6a1…a8d365.
Mesmos76 hashes, ordem diferente. Não há query isolada de40s nem repetição externa
nessas sequências. Todos os152 inputs HQL foram associados por hash ao catálogo
das @Query do JAR preservado;304 chamadas totais ligadas a métodos,264 hashes
exatos,40 validações com texto transformado pelo enhancer. Catálogo e controles
de associação em [historico-complemento.json](historico-complemento.json).

As fontes oficiais locais da versão4.0.2 mostram forHql criando AST próprio e
SimpleJpaQuery validando via EntityManager.createQuery. São duas camadas normais
de preparação; não demonstram duas execuções SQL nem N+1. O parser Spring Data
tenta SLL e pode cair em LL: **não houve instrumentação interna desse fallback**,
logo ausência de forHql repetido não prova ausência de repetição interna do parser.
Não se deduziu complexidade assintótica do ANTLR a partir de tempos pontuais.
Com Q consultas definidas, há Q preparações externas observadas; o custo de cada
parse depende da gramática/estado/JIT, sem promessa de O(tamanho da query).

A documentação oficial confirma bootstrap eager/validação no startup em modo
DEFAULT: [Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/create-instances.html).
Comportamento exato foi conferido também no sources.jar4.0.2, SHA e bibliotecas
em [fontes-primarias.json](fontes-primarias.json). Não há evidência que justifique
reescrever queries, mudar índices, tornar lazy ou retirar validação. Essas
mudanças poderiam alterar erros antecipados, primeira requisição e semântica
financeira sem tratar a condição histórica demonstrada.

## CPU, espera, memória e observação

Windows11 Pro10.0.26200, i7-13620H10 cores/16 lógicos, RAM visível34.070.192.128B.
Docker29.6.2 com16 CPUs/16.623.751.168B; API sem quota explícita. Nativo heap384m,
imagem heap ergonômico: comparação entre plataformas não isola sistema operacional.
Host teve amostras de CPU0,159–0,718 e memória livre4,611–5,711GB decimais durante
as observações. Não é medição de throttling, RSS da JVM, I/O/antivírus ou reserva
de capacidade; não demonstra insuficiência/suficiência universal de recursos.

JFR recortado até o primeiro readiness: amostras main nativas134, das quais35
Spring Data HQL,20 Hibernate HQL,18 ANTLR sem dono visível,35 class loading,10
agent e16 outras. Imagem279:71/25/27/74/29/50 outras e3 JDBC. Categorias são
heurísticas por pilha, não milissegundos de CPU. User JVM médio normalizado
0,181/0,182; machineTotal0,347/0,216 nos JFRs; Windows e VM têm escopos diferentes.
GC total inclui partes concorrentes:0,776/0,527s, diferente das pausas acima.
Thresholds/amostragem impedem concluir inexistência de todas as esperas/leituras.

Última CPU cumulativa da API nativa amostrada:60,125s no controle e68,687s no
instrumentado; múltiplas threads usam vários cores. CPU62/93ms dos clientes
Docker **não é** CPU das JVMs Linux; a interpretação usa JFR da JVM1.
As amostras de recurso podem incluir o breve pós-readiness/dump antes do join;
o recorte de startup do JFR usa readiness separadamente.

Sampler paralelo,1Hz, sem bloquear awaitStatus: trabalho total2.451/51/167/309ms.
Primeira coleta MXBean nativa levou2.360ms; demais máximos27/51/57ms nos outros
cenários. Esse custo pode competir por CPU e fica declarado; não foi subtraído
da medição ou tratado como atraso integral do startup. A etapa gate→HTTP foi
real, sem sinal de readiness ignorado ou erro de relógio nessas observações.

Instrumentação tem custo: diferença de readiness instrumentado−controle
0,727s nativo e4,845s imagem; tempo até primeiro Spring log também cresceu.
Ordem fixa e caches potencialmente aquecidos confundem essa comparação: esses
deltas não são estimativa causal pura do overhead. Agent altera class loading/
JIT; JFR profile e logs BOOT_* também custam. Não extrapolar para os históricos.

JFR.dump antes do destroy produziu gravações válidas4.196.969/3.332.197B; chamadas
ocorreram depois do gate. O jcmd documenta dump de gravação ativa e seu impacto
como baixo, que não significa zero: [JDK21](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html).
Nenhum attach foi feito antes do gate nos controles. A extração nativa textual
com64 frames/alocações gerou1.210.938.571B e excedeu limite de string do Node na
análise inicial. Erro/arquivo preservados, análise refeita incrementalmente com5
testes do leitor (fronteiras/escaping/truncamento). Imagem extraiu o mesmo grupo
analisado sem pilhas de alocação. Nenhum processo de aplicação foi repetido;
o inventário não copia essa expansão para Git. Isso é limitação da análise,
sem influência retrospectiva nos tempos de startup já capturados.

## Hipóteses confrontadas e decisão

| Hipótese | Resultado e limite |
|---|---|
| Query isolada anormal/repetição externa | Não reproduzida:76/76, maiores abaixo de1s; não elimina condição fria/LL/JIT histórica |
| Bootstrap normal dos repositories | Confirmado que há trabalho esperado após EMF; não explica por que algumas ocorrências ultrapassaram40s |
| Espera longa por banco/lock/GC | Não sustenta as2 observações JFR; sem gravação equivalente no estouro histórico |
| Pressão de CPU/memória | Carga e CPU ativa existem; sem intervenção controlada/ocorrência lenta, causalidade não demonstrada |
| Apenas Windows | Enfraquecida pelos históricos Linux; Docker compartilha host Windows |
| Configuração divergente | Comparações novas fixam configuração funcional; diferenças de JDK/heap/plataforma declaradas, não corrigidas por associação |
| Observador perde readiness/relógio errado | Não demonstrado; sucesso real observado, nanoTime preservado; folga de requisição do loop documentada |
| Prazo40s inadequado | Falta fundamento operacional documentado; revisão é decisão futura, não dispensa do gate |

**E, sem correção de produto.** Não se criou contraprova de uma causa inexistente
nem se forçou timeout. Controles sem agent e catálogo independente são
contrastes diagnósticos, não contraprova causal de otimização. Não há mudança
de queries/transações/concorrência que demande reexecução financeira/N+1/EXPLAIN.
Os4 startups exercitam awaitStatus/close reais afetados apenas pela observação;
as5 verificações do parser de evidência não se somam a contratos financeiros.
