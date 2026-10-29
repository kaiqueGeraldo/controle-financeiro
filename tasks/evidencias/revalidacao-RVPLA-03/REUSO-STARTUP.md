# Reuso nativo e startup: conclusões separadas

## Reuso de porta: inconclusivo

PG16/JAR2/3 e PG17/JAR5/6 falharam no mesmo testcase:
PortLifecycleProbeTest.ownedListenerEndsWhileUnrelatedReadyServiceSurvives,
java.net.BindException “Address already in use: bind”, linha32 do probe preservado.
É o bind de ServerSocket à porta anterior, depois de app.close e da assertion
process.isAlive=false. Não é falha de autenticação, readiness ou schema.

Os comandos estão no regression.json/regression-worker.mjs copiado, com
--batch-mode, timezoneUTC, majors16/17, JAR p05 SHA b2967058…31395b e relatórios
pg16/pg17 separados. PG16 seleciona AdoptionPortAllocationTest e os dois métodos
do PortLifecycleProbeTest. PG17 acrescenta os três contratos originais de
auth/ownership/freeze, readiness/DB e jobs. O teste de porta explícita ocupada
recusou readiness do terceiro, preservando-o. O probe de bind imediato continua
falho, byte idêntico; nenhum retry, timeout maior ou assertion relaxada.

| Hipótese para esses dois erros | Evidência / limite |
|---|---|
| Wrapper sobrevivo/Java tardio após Node interrompido | Nenhuma interrupção Node nesse caso; processo App já encerrado. Não há vínculo com RVPLA-03 |
| RVPLA-04 durante consulta | O bind ocorre dentro do Maven/JUnit; consulta de boundary pós-Maven acontece depois. A reprodução GUI é outro disparo |
| Recurso de socket ainda indisponível | BindException demonstra indisponibilidade naquele instante; não identifica owner/estado TCP |
| PID/identidade errados | Nenhuma divergência capturada; falta diagnóstico do socket, não autorização para afirmar causa de identidade |
| Corrida de reserva antes do Tomcat | Regressão de porta0 passa; alocador antigo detectado por colisão, restaurado1/1. O erro atual é pós-encerramento |
| Startup | Os contratos afetados e o próprio app antes do rebind ficaram prontos sob o observador original; falha está na linha32 posterior |
| TIME_WAIT/FIN_WAIT/serviço concorrente | Possíveis; não houve captura TCP no instante. Não atribuir retroativamente um estado pelo sucesso Linux ou posterior |

Linux4/4 e ausência final de processos não apagam os dois erros. Reuso do número
fixo imediatamente após HTTP permanece **não certificado**, residual separado.
Não contradiz a prova de encerramento da árvore sob abandono nem é condição
histórica do aceite da reserva dinâmica no listener real. Não se encerra o
residual por interpretação: ele fica explícito e impede alegar reuso universal.

Não foi repetido outro ciclo TCP até passar: os dados já localizam o erro e o
delta não fornece nova causa. Próximo experimento específico: helper nativo
pré-inicializado, registrar tabela TCP/owner imediatamente no catch do primeiro
bind, com handles de App/filhos e relógio monotônico. Se PID próprio vivo/listener,
investigar cleanup; se só tupla de transporte/PID0, caracterizar a semântica do
socket; se outro PID, registrar sua identidade sem encerrá-lo; sem captura, manter
inconclusivo. Uma execução delimitada, sem rebind automático para buscar verde.

## Startup HQL: inconclusivo, gate não aprovado

Nenhuma ocorrência histórica recebeu vínculo causal novo com wrapper antigo.
O delta muda supervisão/observação, não queries, src/main, configuração, migrations
ou JAR. Frames HQL após JPA continuam localização de trabalho, sem causa completa
ou defeito do parser demonstrado. Não atribuir as falhas antigas à porta ou à
nova enumeração apenas porque os mecanismos existem.

O40s permanece em AdoptionRuntimeTest.awaitStatus; veio do harness8605ea4 e não
de SLO encontrado no SDD. Connect1s/request8s e polling100ms foram preservados;
uma requisição já em andamento pode atravessar a borda externa. Duração JUnit
inclui preparação/cleanup e não é boot medido. Nenhuma revisão/dispensa de prazo.

Falhas ainda não explicadas: p03/classes1, p05/JAR3, p04/Linux2 e revisão original
17/3. A falha nova Port52317 do saneamento anterior foi explicada por bind; não
representa esses estouros. Timelines reaproveitadas37,365/34,321s e23,215/21,137s
mediram prontidão antes40s, mas não apagam falhas. Observadores90/100s eram apenas
diagnóstico, sem aprovação posterior do gate. JFR nativo0bytes é inválido; Linux
válido e sequência76 queries rápidas não reproduziram o custo histórico.

Rodada atual: os três contratos originais passaram em JAR/PG17 e na imagem;
isso confirma as assertions dessa rodada, sem estimar percentis ou estabilidade.
Eliminado no recorte: abandono antigo como capacidade de executar após o Job
comprovadamente ausente. Possíveis ainda: ordem de preparação/class loading/JIT,
carga do host, GC/esperas não capturadas na ocorrência lenta. Não se demonstrou
que qualquer uma responde por todo o atraso.

Sem experimento HQL adicional: não surgiu hipótese causal nova dessa correção.
Próximo ensaio: uma captura fria nativa e uma Linux, sequenciais, mesmo JAR/JDK/
heap/config, PG pronto/schema migrado, recursos declarados e Jobs/processos
anteriores comprovadamente ausentes. Tempos por query/fase e JFR com flush antes
de encerrar;40s é resultado separado, até90s somente diagnóstico. HQL dominante
localiza consulta/ordem; class loading/JIT/GC dominante orienta esse custo; JDBC/
lock exige espera observada; duas rodadas rápidas mantêm inconclusivo e encerram
o experimento. Nada de lazy/query/heap/orçamento alterados por hipótese.

Critério pendente: causa/controle discriminante dos estouros e aceite documentado
da previsibilidade no orçamento aplicável. Publicação/ativação e preparo integral
continuam sem aprovação; investigação local pode prosseguir por autorização própria.
