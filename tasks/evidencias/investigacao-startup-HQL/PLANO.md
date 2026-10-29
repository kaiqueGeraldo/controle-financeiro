# Plano prévio — startup HQL

Base conferida: c091abb8aa0473e7ad46690e21c8158a4dde234a. Branch própria
codex/diagnostico-startup-hql; somente README raiz alheio no início, SHA histórico
conferido. Sem alteração de produto, queries, dependências ou contrato proposta.

| Hipótese | Evidência esperada | Experimento | Confirma/enfraquece | Limite |
|---|---|---|---|---|
| Startup normal excede o orçamento em alguma plataforma | Readiness real, fases e processo vivo ao vencer o gate | Primeiro par: Windows/JAR e aplicação Linux/Docker, sem agent/JFR | Estouro pré-bind mantém problema de startup; bind falho é classe distinta | Uma tentativa por plataforma |
| Parsing/validação domina o trecho após JPA | Sequência real, hashes, durações e CPU amostrada | Segundo par: mesmos inputs com agent anterior + JFR profile | Repetição/hash ou query dominante sustentaria hipótese; presença de frame isolado não basta | Uma tentativa por plataforma; sem selecionar melhor resultado |
| GC, carga, espera por DB ou observador explicam atraso | CPU/memória/GC/I/O e tempo das consultas do observador | Amostragem do processo e host; JFR no segundo par | Correlação localizada, sem afirmar causalidade por comparação entre duas amostras | Sem gerar carga artificial ou variar recursos |
| Instrumentação altera o resultado | Diferenças do primeiro para o segundo par | Controle anterior sem instrumentação | Diferença é associação, confundida por caches/ordem; não subtrair como overhead puro | Quatro processos de aplicação no total |

Começar pelo par do encaminhamento TCP aceito, encerrando/auditando cada cenário.
O segundo par é complemento previamente delimitado para medir a sequência HQL e
validar o flush JFR antes do cleanup, lacuna expressa do diagnóstico anterior.
Não executar rodada extra para obter verde ou reproduzir uma corrida.

PG17 descartável já pronto e schema V1–V16 migrado fora de t0, como no contrato
adoption: a API mantém schema validate obrigatório dentro do prazo. Mesmo schema
sintético vazio nas quatro observações; writers=true, jobs=false, JDBC connect/
socket=2s. Mesmo JAR p05 e imagem local anteriores, sem build de produto. Windows
com -Xmx384m e JDK21.0.12.1+1; imagem com heap ergonômico e JDK21.0.12+8: essa
diferença histórica permanece explícita, comparação entre plataformas não isola OS.

O prazo original começa na entrada de App.awaitStatus, após ProcessBuilder.start;
40s em nanoTime, connect1s/request8s/poll100ms. Sucesso é readiness HTTP200 na porta
real. Registrar separadamente t0 imediatamente antes de start, retorno de start,
entrada/retorno de awaitStatus e eventual sucesso depois de40s. O helper original
pode retornar sucesso além do deadline se uma chamada iniciada antes terminar
depois; nenhum sucesso tardio será contado como atendimento estrito de40s.

No timeout, preservar a falha original; observar somente até90s desde criação,
sem converter a observação em aprovação. Thread.print apenas depois da falha,
não contaminar o controle antes de40s. Instrumentados fazem JFR.dump antes de
encerrar. Usar App.close TCP aceito, sem alterar seus prazos/identidade. Abertura
de porta, liveness, readiness e HTTP funcional401 sem token são marcas distintas.
Porta descoberta pelo log é limite superior, não instante exato do bind do SO.

Frio significa JVM nova, sem estado JIT anterior; cache de disco/OS/Docker não é
esvaziado nem controlado. O segundo par tem caches potencialmente aquecidos.
Docker sobre Windows compartilha o host e não certifica supervisor Linux nativo.
Sem npm/build concorrente durante processos de aplicação; programas alheios são
somente inventariados. Encerrar após o conjunto fixo com classificação A–E.
