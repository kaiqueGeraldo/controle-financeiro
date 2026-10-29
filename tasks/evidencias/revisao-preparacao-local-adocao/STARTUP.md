# Investigação dirigida de startup

**Resultado: fase de trabalho localizada; causa completa inconclusiva. Gate de
40s não aprovado.** Não foi demonstrado defeito funcional do produto, latência
aceitável, erro do relógio ou defeito do observador original. Nenhum prazo/retry
ou critério de aceite foi alterado.

## Original preservado e reprodução

[startups-originais.json](startups-originais.json) liga XMLs e logs preservados por
hash: p03 teve um estouro nativo por classes; p05 teve três por JAR e 17/17 na
imagem; o controle posterior p04 teve dois estouros Linux, conforme o witness
histórico. Os logs originais não fornecem pilhas/CPU no instante do estouro.
Não escolher a rodada verde e descartar a posterior falha.
O [complemento Linux](startups-linux-originais.json) reconfere os dois casos
falhos p04 e seus logs por SHA, sem executar novamente aquele runtime.

Reprodução nova, runtime revisao-20261026-01: **17 testes originais, 3 falhas,
0 erros/skips**. O arquivo AdoptionRuntimeTest não foi editado. Falharam no
primeiro readiness esperado: releasedProcess, readinessFails e enabledJobs.
Durar 49,411/43,016/43,391s no JUnit inclui preparação/cleanup e não transforma
esses números em tempo de bootstrap medido. O loop original usa nanoTime, 40s,
HTTP connect 1s/request 8s e intervalo 100ms; uma requisição em curso/cleanup
pode fazer a duração externa exceder 40s. Não foi observado sucesso ignorado.

O mesmo controle Linux mutante do filtro também excedeu 40s antes de alcançar
a escrita. Não contou como mutação detectada; o gerador original interrompeu com
Missing causal effect, restaurou a fonte e foi preservado sem correção/resume.

Pacote executado: JAR p05, SHA b2967058…31395b, inputs 24844b5 completo no parecer.
Imagem: ID sha256:8c102183…568ef1, mesmo JAR embarcado verificado novamente.
Native: Java 21.0.12.1+1, -Xmx384m; imagem: Java 21.0.12+8, ergonomia padrão,
Linux amd64/usuário 10001. Perfis/flags explícitos: adoption, casos writers false
ou true, jobs false ou true conforme contrato. Não foi usado .env remoto.
PostgreSQL 17.11 descartável, clientes 17.11; criação de schema e 16 migrations
terminaram antes da criação de cada processo de aplicação. Testcontainers
observou readiness do banco e JDBC executou SQL antes do bootstrap.

Docker observado: 16 CPUs, 16.623.751.168 bytes de memória, Engine 29.6.2.
Não havia limite de CPU/memória explícito nos containers de aplicação. Isso não
mede CPU livre, pressão de I/O, antivírus ou memória livre do Windows histórico.
Durante a reprodução nova original houve instalação npm offline na mesma máquina;
isso é um fator de carga registrado, **não uma causa comprovada**. O diagnóstico
inicial foi sequencial antes dessa instalação. A contraprova Linux posterior
também falhou depois de ela terminar. Não há ensaio de carga controlada suficiente
para concluir causalidade de concorrência ou insuficiência de recursos.

## Linha do tempo observada

O diagnóstico independente registra criação e probes com nanoTime. O teto de
100s é apenas diagnóstico; a primeira resposta já ocorreu antes de 40s em ambos
os processos, sem retry/reclassificação do controle original. UTC externo foi
comparado aos logs locais nativos de São Paulo e aos logs UTC da imagem.
Não subtrair horários de fusos distintos; o produto altera TimeZone em
PostConstruct e o formato dos logs não inclui offset. Durações da tabela são
aproximadas onde dependem de timestamps de log, e exatas ao milissegundo nos probes.

| Marco | JAR Windows, t desde criação | Imagem Linux, t desde criação | Alcance da prova |
|---|---|---|---|
| Processo criado | 0,016s, PID41416 | 0,020s, cliente Docker PID69036 | No Linux a JVM é PID1 no container, não o cliente Docker |
| Primeiro log da JVM/Spring | ~3,63s | ~4,68s | Início exato da JVM fica entre criação e primeiro log |
| Tomcat inicializado | ~14,29s, porta63230 | ~11,95s, porta8080→63088 | Inicializado não significa HTTP pronto |
| Conexão JDBC adicionada | ~18,73s | ~14,62s | Banco efetivamente acessível |
| Hibernate/JPA concluído | ~24,78s | ~19,75s | Validate incorporado ao EMF; sem marcador separado de início/fim de cada validação |
| Preparação de consultas Spring Data anunciada | ~24,98s | ~20,00s | Há trabalho posterior antes da porta atender |
| Tomcat started / contexto completo | ~36,91/36,93s | ~33,81/33,85s | Aplicação declara Started em 34,674/31,095s, diferente do tempo externo |
| Registro de endpoints | Sem log específico | Sem log específico | Comprovado até o primeiro GET200; não inventado um timestamp de registro |
| DispatcherServlet inicializado no primeiro GET | ~37,09s | ~34,05s | Inicialização lazy do servlet, depois de Tomcat started |
| Liveness/readiness200 observados | **37,365s** | **34,321s** | Endpoints e portas corretos, processo ainda vivo |
| DB pausado: readiness503/liveness200 | ~1,031s de probe | ~1,032s de probe | Sem dependência de DB para liveness |
| DB retorna: readiness200 | 38,558s, mesmo PID | 35,466s, mesmo container/JVM | Recuperação sem reinício |
| Término controlado pelo observador | Processo ausente | Container parado; graceful shutdown completo no log | Exit do cleanup não é falha espontânea de produto |

Migração ocorreu no preparador antes de t0. A API adoption não executou Flyway.
Conferir [execucao/startup/results.json](execucao/startup/results.json) e logs
sanitizados. O exit1 registrado após process.destroy no Windows/cliente Docker
é consequência do cleanup desse observador; ele viu processo vivo e ready antes
de encerrá-lo. Não atribuir esse exit ao startup.

## Pilhas e experimentos discriminantes

O amostrador não alterou o arquivo original e limitou-se aos filhos com o caminho
do JAR p05 e perfil adoption. Oito tentativas em 25/35s; seis dumps bem-sucedidos,
duas falhas de attach preservadas. Não chamá-las de dump válido. Exemplo PID47912,
idade36,096s: CPU total104,25s, RSS444.239.872 bytes; thread main RUNNABLE,
CPU28.812,5ms e elapsed35,16s, em ANTLR ParserATNSimulator → HqlParser.predicate →
JpaQueryEnhancer.forHql → SimpleJpaQuery → inicialização de repositório.
O log já tinha conexão Hikari e EntityManagerFactory. Isso demonstra trabalho
de CPU na construção de queries naquele instante, sem provar qual consulta
ou causa responde por todo o atraso.

Attach/jcmd pode introduzir safepoints e alterar duração; a reprodução instrumentada
não isola seu próprio custo. Falhas históricas sem esse amostrador permanecem a
referência adicional. O diagnóstico independente também consulta dois probes e
remove JDK_JAVA_OPTIONS/_JAVA_OPTIONS, além de JAVA_TOOL_OPTIONS; não é comparação
de latência com todas as variáveis idênticas ao observador original.

Probes sem banco/contexto, sobre as anotações do **JAR original** e Spring Data
JPA4.0.2/ANTLR embarcados:

| Experimento | Resultado | O que discrimina / limite |
|---|---|---|
| 76 consultas HQL em ordem fixa, bibliotecas extraídas | Processo4,746s; soma de parse~3,412s, sem erro | O parser isolado funciona; não reproduz bootstrap completo/ordem de beans |
| Mesmas76 via PropertiesLauncher/bibliotecas aninhadas | Processo8,187s, sem erro | Carregamento do pacote tem custo distinto; não explica sozinho o estouro |
| Cinco maiores queries, cada uma primeiro em JVM nova/aninhada | Processos2,979–4,391s; zero erro/timeout de30s | Contraprova da hipótese de uma dessas cinco ser isoladamente um parse de40s; outras ordens/transformações/queries não foram isoladas |

Não houve edição de query, índice, bootstrap mode, parser ou dependência. As
queries de domínio são idênticas na base 46b85ee, no produtor e no candidato;
não há diff nesses repositórios. Não concluir regressão introduzida pelo lote
nem complexidade assintótica do ANTLR a partir dessas amostras.

| Hipótese | Resultado dirigido |
|---|---|
| Espera inicial pelo banco/lock/schema validate | Não explica o instante amostrado: conexão e EMF já completos; não houve espera JDBC na main dessas pilhas. Não exclui todo custo anterior |
| Configuração inválida | Overrides inseguros falham cedo; os casos lentos passaram pelo guard/JPA sem erro de config. Não é a falha observada nesses casos |
| Porta/path/relógio incorretos | Mesmo endpoint/porta atendem no diagnóstico; prazo original monotônico; não foi demonstrado erro do observador |
| Filho encerrado/desvinculado | PIDs vivos e pilhas obtidas durante os estouros; término ocorre no cleanup. Hipótese não sustentada para os casos capturados |
| Frio/JIT/ordem de parsing/carga do host | Possíveis; parser isolado não reproduz custo integral. Sem atribuição causal fechada |
| Somente Windows/JAR | Refutada como explicação exclusiva: já existem falhas Linux e nova mutação Linux parou no mesmo gate |
| Produto necessariamente nunca sobe | Refutada para a configuração sintética exercitada pelos dois processos que ficaram ready; não certifica estabilidade |

## Origem do limite e próximo experimento

O limite40s entrou no teste em **8605ea425706c82328ceb6e0283644b8dbe976a2**,
AdoptionRuntimeTest.java:275–283. Não foi encontrado SLO de40s no SDD examinado.
Ele é um controle do harness candidato, cuja falha foi corretamente preservada;
ausência de SLO não concede dispensa. Os300s padrão do healthcheck Railway são
semântica do provedor, não medição nem contrato aprovado de latência deste produto.

Próximo experimento delimitado: mesma imagem/JAR/digest, DB já pronto, recursos
declarados, uma JVM de aplicação e sem instalação/compilação concorrente; iniciar
JFR de bootstrap com CPU/allocations/class loading/GC e eventos temporizados de
criação de query/bean. Observar40s sem mudar seu resultado e até90s apenas para
capturar conclusão/erro posterior. Amostrar a sequência real de consultas, não
somente ordenação alfabética de anotações. Se houver caso discriminante, comparar
alteração mínima em cópia e preservar o original; não trocar para lazy, aumentar
prazo ou reescrever consulta financeira antes de provar a causa.

Critério proposto para decisão posterior: definir orçamento de startup a partir
de execuções frias sob CPU/memória e janela operacional declaradas, explicitando
tempo desde criação até readiness e variância. Rever o40s somente por decisão
documentada com esses dados; manter teste original e regressão que detecte a
causa identificada. Não há amostra suficiente para prometer percentis/SLO novo.
Até isso, publicação/ativação da API e estabilidade de startup não estão aprovadas.
