# Contrato e reconstrução das ocorrências

O contrato foi registrado no [plano anterior aos experimentos](PLANO.md). Fontes
examinadas: `AdoptionRuntimeTest.App`, `AdoptionPortAllocationTest`, o probe
independente [PortLifecycleProbeTest](../revalidacao-preparacao-local-adocao/PortLifecycleProbeTest.java),
o [plano original da revalidação](../revalidacao-preparacao-local-adocao/PLANO.md),
`revalidar-porta.mjs`, e os XMLs/logs, não somente os pareceres.

## Propriedade e sucesso

No modo JAR nativo, a JVM lançada diretamente por ProcessBuilder abre o listener
Tomcat. `--server.port=0` delega escolha/reserva ao próprio listener. Seu log UUID
fornece a porta efetiva; somente depois é feito HTTP. Não existe porta exposta
por reserva provisória liberada nesse caminho. A regressão dessa alocação foi
aceita antes; não se reabre a antiga corrida reserva/liberação/bind.

`App.close` é dono do término dessa JVM. O probe independente requer processo
ausente, bind imediato **na mesma porta** por `ServerSocket` em127.0.0.1 com
reuseAddress=true, aplicação respondendo UP antes de close e serviço alheio sem
hits durante sua validação, vivo/respondendo depois. Esse reuso é requisito
explícito da fixture independente; não foi encontrado SLO de reuso imediato no
produto. A correção fortalece a pós-condição de close, preservando essa assertion.

Isolamento: banco Testcontainers16/17 descartável, schema UUID migrado antes do
start, mesmo JAR p05, log por processo, sem wrappers nativos do lançamento da
aplicação. Maven/cmd são ancestrais do teste, não descendentes da JVM da API.
Nenhum PID é encerrado por nome/porta. Porta0/falha pré-bind, Docker e Linux
preservam o caminho anterior. Linux em Docker não certifica supervisor nativo Linux.

## Os dois erros preservados de27/10

| Campo | PG17/JAR,5/6 | PG16/JAR,2/3 |
|---|---|---|
| Invocação | `porta-pg17`, em `revalidar-porta.mjs`; argumentos exatos em `execucao/porta-execucoes.json` da revalidação | `porta-pg16`, mesmo driver/recibo |
| Processo lançado | JDK21.0.12.1, `java -Xmx384m -jar <p05/package/api.jar>` + adoption,server.port=0,writers=true,jobs=false | Mesmos comando/configuração/JAR |
| PID/API |19268; nascimento exato não coletado; logUUID780158c9-6c2c-41b1-972a-b01189f351f4 |66060; nascimento exato não coletado; logUUID36606f4f-9636-4078-83f9-3e31f6832d8d |
| Porta |59466|54538|
| Tomcat anunciou |12:24:23.105Z|12:25:30.131Z|
| Dispatcher inicializou |12:24:23.268–269Z|12:25:30.304–305Z|
| Processo anterior |O próprio app, UP e vivo no bloco; `owned.isAlive()==false` passou depois de close |Mesmas assertions passaram|
| Comando que falhou |`new ServerSocket(); setReuseAddress(true); bind(new InetSocketAddress("127.0.0.1",ownedPort))` no JVM Surefire |Idêntico|
| Exceção exata |`java.net.BindException: Address already in use: bind`, linha32 |Idêntica, linha32|
| Código Winsock bruto |Não registrado. Java pode normalizar WSAEACCES em WSAEADDRINUSE; não atribuir10048 bruto a esses logs |Também ausente|
| Família |Alvo Java IPv4/loopback. Família do handle original/novo não foi capturada |Também não capturada|
| Janela de término/bind |Depois da prontidão, antes do próximo caso iniciar em12:24:23.522Z; nanos/instante exato ausentes |Depois da prontidão, antes de12:25:30.503Z; nanos/instante exato ausentes|
| Observador |Erro de bind após processo ausente; sem INDEPENDENT_CLEANUP, restante desse método não executado |Idêntico|

Os horários Tomcat/Dispatcher em São Paulo nos logs foram convertidos para UTC
somando3h; Maven já estava emUTC. A linha de erro impressa após outro teste não
fornece o instante do bind. PID/nascimento do JVM Surefire e dos listeners alheios,
tuplas TCP, descendentes e opções nativas **não existem nos registros históricos**.
Não foram reconstruídos retroativamente. Os dois logs de aplicação terminam
depois da prontidão, sem evidência de shutdown cooperativo. Seu conteúdo não
prova sozinho a forma do encerramento no kernel.

Fontes exatas, todas preservadas na revalidação:

- `execucao/porta-pg16.log`, `porta-pg17.log` e `porta-execucoes.json`;
- `execucao/porta-pg16-reports/TEST-com.controlefinanceiro.api.migration.PortLifecycleProbeTest.xml`;
- `execucao/porta-pg17-reports/TEST-com.controlefinanceiro.api.migration.PortLifecycleProbeTest.xml`;
- `execucao/processos/36606f4f-9636-4078-83f9-3e31f6832d8d.log`;
- `execucao/processos/780158c9-6c2c-41b1-972a-b01189f351f4.log`.

O diagnóstico posterior antigo (`transport-diagnostic-02`) conseguiu reusar as
portas após consulta externa; essa consulta altera a janela. Não explica o estado
dos binds falhos. Sua versão1 falha por encoding também permanece preservada.

## O que a captura nova demonstra

`original-window-pg17.json` registra PID50108/nascimento12:41:44.538Z,
porta53044, cliente Surefire33208. Antes do close: LISTEN em0.0.0.0/:: da API e
ESTABLISHED IPv4 nos dois lados. O mesmo método original falhou novamente:

| Marco nanoTime | Valor | Intervalo |
|---|---:|---:|
| close começou |1058106107691700|—|
| close retornou |1058106108518500|0,8268ms|
| bind começou |1058106108669900|0,1514ms após close|
| amostra TCP após erro, relógio externo |10581061098789/frequência10.000.000|aprox.1,36ms após close|

Nessa amostra ainda havia LISTEN IPv4/IPv6 e ESTABLISHED atribuídos ao PID50108,
apesar da assertion de processo ausente. `bindEnd=0` significa bind lançou exceção,
não duração zero. Relógios monotônicos do Java e Stopwatch têm escalas distintas;
comparações entre fontes são aproximação explícita, dentro da mesma máquina.

Os dois sintéticos abruptos reproduziram BindException em loopback e wildcard,
com LISTEN/ESTABLISHED do filho encerrado e cliente identificado. Os seis
cooperativos passaram; casos com FIN_WAIT_2/CLOSE_WAIT também permitiram bind.
Logo não se atribui o mecanismo a TIME_WAIT, somente à existência de conexão,
exclusividade defeituosa ou escolha de IPv6.

**Causa local demonstrada:** a pós-condição do harness equivalia término do
processo à liberação TCP. No Windows testado, essa equivalência falha numa janela
curta após término abrupto. Há reprodução equivalente no próprio probe/JAR e
num processo mínimo; não é possível provar que cada ocorrência histórica teve
as mesmas tuplas, pois não foram amostradas. Não se declara bug do Windows,
processo órfão, colisão com terceiros ou defeito da aplicação.

## Fontes de plataforma consultadas

[Microsoft: exclusividade e encerramento de sockets](https://learn.microsoft.com/en-us/windows/win32/winsock/using-so-reuseaddr-and-so-exclusiveaddruse)
documenta que fechamento e possibilidade de reuso podem ocorrer em momentos
distintos. O [código OpenJDK21 de bind no Windows](https://github.com/openjdk/jdk21u/blob/master/src/java.base/windows/native/libnet/net_util_md.c)
explica a normalização do erro; não recupera o errno perdido. O `lib/src.zip`
do Temurin usado também foi lido: NioSocketImpl e ServerSocketChannelImpl emulam
reuseAddress quando exclusiveBind está ativo. Nenhuma dessas opções foi relaxada.
As fontes fundamentam hipóteses; a conclusão causal se apoia nas capturas locais.
