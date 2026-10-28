# Conferência das medições e limites HQL

## Proveniência e ambiente

JAR p05 `b2967058…31395b`, 22 recursos (16 migrations) conferidos diretamente no
ZIP, sem rebuild. Produto/src/main/pom/frontend sem diff desde o produtor
`24844b59`. Imagem inspecionada somente em leitura:
`sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`,
Linux/amd64, usuário10001, label do produtor/JAR corretos, Java21.0.12+8.
O SHA embarcado já havia sido obtido por comando interno na imagem; o recibo
bruto dessa extração foi rehashado. Esta revisão não iniciou outro container
para repetir essa extração. ID local/RepoDigest não prova publicação em registry.

Nativo: Temurin21.0.12.1+1, Xmx384m; imagem: heap ergonômico, sem quotas explícitas.
PostgreSQL17.11 real aparece nos quatro logs; Cf017PostgresSupport exige major,
clientes e banco descartável com nome UUID, sem fallback externo. Recibo de DB
pronto com 16 migrations às19:59:13.400Z, antes do primeiro t0 às19:59:13.617Z.
Mesmo schema vazio nos quatro cenários, adoption/writers=true/jobs=false.
JDBC connect/socket2s, aquisição3s/validação1s; Flywayfalse/validate/SQLinitnever.

Host Windows11/i7-13620H/16 lógicos/~34GB; Docker compartilha host,16 CPUs/~16,62GB.
Amostras de CPU/memória não demonstram reserva de capacidade, ausência de antivírus,
throttling/I/O ou carga de outros programas. Capturas são sequenciais, sem build/npm
concorrente; compilação do probe terminou antes do banco/app. Java20288 preexistente
foi preservado. As quatro aplicações não se sobrepõem segundo criação/close/recibo.
JVMs novas; cache de SO/disco/Docker não foi esvaziado. JDK_JAVA_OPTIONS/_JAVA_OPTIONS
não são removidos adicionalmente pelo App; hermeticidade absoluta não é prometida.

## Medição, processo e endpoint

| Cenário | PID cliente / JVM | Listener efetivo | JPA desde criação | Readiness desde criação | Dentro do gate original |
|---|---|---:|---:|---:|---:|
| native-control | 64032 / 64032 | 53120 | 12,395s | 18,925s | 18,907s |
| image-control | 46352 / 1 no container UUID | 53124 | 8,220s | 13,824s | 13,813s |
| native-instrumented | 45364 / 45364 | 61591 | 13,223s | 19,652s | 19,607s |
| image-instrumented | 50356 / 1 no container UUID | 60421 | 12,944s | 18,669s | 18,652s |

Criação é nanoTime antes de ProcessBuilder.start; gate é outro nanoTime antes de
awaitStatus. Primeiro log/JPA são wall clock correlacionados, resolução1ms,
São Paulo no Windows e UTC na imagem. Deltas criação→gate11–45ms. Sucesso usa
tempo monotônico; não foi calculado por duração JUnit, relógio de parede ou CPU.
O log Spring anuncia a porta real; Docker resolve o mapping pelo daemon. Só depois
GET `/ops/health/readiness` HTTP200 satisfaz o gate. A porta não é readiness.

O endpoint real exige writers abertos, ACCEPTING_TRAFFIC e conexão válida. O
body esperado é `{"status":"UP"}`, DOWN/503 em manutenção ou DB inválido,
Cache-Control:no-store. Os quatro JSONs novos só guardam status, não body/headers;
o original releasedProcess verifica o body exato e os contratos HealthController
e de indisponibilidade têm aceite independente preservado. Não se inventa uma
captura nova de conteúdo. /accounts401 e liveness200 foram observados depois de
readiness, não usados para antecipá-la. Não se mede sua primeira disponibilidade.

O loop canônico pode aceitar HTTP iniciado antes e terminado após o deadline,
pois não reconfere prazo depois do send. Nenhum dos quatro sucessos depende dessa
folga: ambos os relógios ficaram abaixo40s, com margem >20s. É limite conhecido do
observador, não falha de prazo demonstrada aqui. Não foi corrigido nesta revisão.

Cada awaitStatus teve flag original de sucesso; nenhum diagnosticReadiness tardio
foi contado. O catch que permite observação até90s não foi usado. Não houve retry
de processo; polling HTTP100ms pertence ao contrato. A cor JUnit isolada seria
insuficiente, pois o probe preserva a falha original sem relançá-la ao JUnit.
JFR.dump ocorreu depois de readiness; close byte idêntico ao TCP aceito. Cleanup
confirmado4/4; nenhum processo próprio/container ativo no recibo final original.
As portas corretas foram auditadas; 64885 é remotePort/TimeWait, não listener.

## O que o agent realmente mede

BootAgent externo intercepta `JpaQueryEnhancer.forHql(String)` e overloads de
`AbstractSharedSessionContract.createQuery(String,...)`; construtor SimpleJpaQuery
fornece o rótulo de método. SHA-256 representa **os bytes UTF-8 do texto recebido**,
sem normalização: não é identidade de AST, plano SQL, custo ou execução no banco.

Spans foram reconstruídos novamente: diferença entre nanoTime final/inicial igual
ao campo de duração em todos os pares, hash confere, nenhum par incompleto e todos
OK. Apenas chamadas externas por origem entram na soma; não se somam overloads
Hibernate aninhados como trabalho independente.

| Observação instrumentada | forHql externo / hashes | Soma / maior forHql | createQuery externo / soma |
|---|---:|---:|---:|
| Nativo | 76 / 76 | 2.044,406 / 831,853ms | 76 / 947,364ms |
| Docker | 76 / 76 | 1.680,014 / 474,889ms | 76 / 878,588ms |

Catálogo de @Query do pacote tem76 entradas; recibo de associação confere152
forHql e304 chamadas externas totais.20 textos Hibernate por cenário foram
transformados: nesses40 casos a associação usa o método, não hash idêntico à
annotation. Os conjuntos forHql são iguais entre plataformas, em ordem diferente.

Ficam fora: fallback interno SLL→LL, operações internas não interceptadas, JPQL/
SQL por outros caminhos, leitura de classes/JIT fora desses métodos e causas das
ocorrências antigas. As fontes oficiais locais4.0.2 confirmam SLL com fallbackLL
e validação separada via EntityManager.createQuery; o fallback não foi contado.
76 hashes distintos não provam ausência de todo trabalho interno repetido.
Parsing/validação são preparação normal, não evidência de76 consultas SQL nem N+1.

O log não traz thread id; a pilha por origem e o rótulo global de método não são
um tracer correto para concorrência arbitrária. A leitura serve à sequência de
bootstrap registrada, associada ao catálogo; não generalizar à execução concorrente
de queries. Tampouco inferir complexidade ANTLR pelo tamanho/tempos dessas amostras.
Há Q preparações externas observadas para Q textos; custo interno não foi isolado.

Advice inclui hash/log de entrada entre os timestamps e altera carregamento/JIT.
Sampler1Hz teve trabalho total2.451/51/167/309ms; primeira coleta nativa2.360ms,
executada em paralelo e capaz de competir por CPU. Não foi subtraído dos tempos.
Instrumentado−controle: +0,727s nativo e+4,845s Docker; ordem fixa/caches confundem
comparação, portanto não são estimativas causais puras de overhead.

## JFR e leitor

Gravações válidas4.196.969/3.332.197 bytes, hashes conferidos. A releitura incremental
encontrou4.585/533 eventos extraídos, com contagens de todos os tipos selecionados
iguais ao jfr-summary original; recorte e somas GC conferem. Docker também passou
JSON.parse estrito. A extração nativa1,21GB contém grandes amostras de alocação,
não foi carregada como string única. Nenhum startup foi repetido para reanalisar.

Os5 testes originais passam. Complemento detectou aceitação de envelope truncado
depois de `events]` e vírgula final antes de `]`. Impacto limitado: as duas extrações
atuais têm fechamento completo, hashes/contagens conferidos; não foram usadas
as entradas sintéticas inválidas para medir startup. Um futuro leitor deve validar
também o envelope, com testes adversariais; nenhuma fonte histórica foi alterada.

O filtro original inclui evento cujo início é anterior ao cutoff, mesmo que seu
fim ultrapasse readiness (3/4 eventos nas duas capturas). Por isso totais desse
recorte não são atribuição exclusiva de CPU até readiness. Categorias de pilhas,
thresholds JFR e somas GC não provam ausência universal de espera nem duração exata
de cada fase. `eventsFromChunks` guarda o evento atual; analisar.mjs ainda retém
os eventos selecionados: memória O(E selecionados + maior evento), não O(1) de
ponta a ponta. Esses limites não afetam os nanoTimes do gate.
