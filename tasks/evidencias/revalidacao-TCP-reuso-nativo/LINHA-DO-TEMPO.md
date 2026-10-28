# Mecanismo reproduzido e atribuição histórica

## Reversão causal própria

Uma execução, mesmo probe/JAR/opções, App antigo extraído de Git 3b245d9d.
Somente marcadores nanoTime primitivos entre close e bind, sem enumeração, sleep
ou I/O nessa janela. Observador nativo iniciado antes capturou snapshots antes
do close e depois do erro. Assertions originais mantidas.

JVM PID 54108, nascimento 2026-10-28T13:24:53.557Z, porta 52207. Antes do close:
LISTEN IPv4/IPv6 em 0.0.0.0/:: e conexão com o cliente Surefire. A assertion de
processo encerrado passou; o bind único seguinte lançou java.net.BindException.

| Marco | nanoTime / observação |
|---|---|
| Pedido de close | 1060686279787499 |
| Retorno de close antigo, depois de waitFor | 1060686280522000; 0,734501ms de close |
| Início do bind 127.0.0.1:52207 | 1060686280629700; 0,1077ms após close |
| Resultado do bind | BindException; bindEnd=0 significa exceção, não duração concluída |
| Snapshot posterior | LISTEN IPv4/IPv6 e ESTABLISHED ainda atribuídos a 54108; fim da amostra aproximadamente 2,4392ms após close |

As escalas nanoTime/Stopwatch não têm o mesmo contrato de API; a conversão do
snapshot externo é aproximação explícita na mesma máquina. Intervalos entre
marcos da mesma JVM usam diferença monotônica direta. O snapshot posterior não
é simultâneo ao bind. Reversão exata, exceção, PID próprio e controle restaurado
sustentam juntos a relação causal; não se depende apenas de associação entre
duas observações verdes.

Dois sintéticos abruptos também registraram BindException em loopback e
wildcard, com TCP do filho encerrado ainda presente. Seis cooperativos reusaram,
inclusive com outros estados de conexão. Não se atribui automaticamente o
problema a TIME_WAIT, IPv6, processo órfão ou bug de produto. Estados e identidade
amostrados constam nos JSONs. Bind diagnóstico falho é dado, não aprovação do
contrato original.

## Controle corrigido posterior às restaurações

JVM PID 69580, nascimento 2026-10-28T13:26:50.860Z, porta 55825. Marcadores
adicionais no App copiado capturaram retorno de waitFor, deadline e pós-condição.
Fonte canônica e cópia final restauradas por SHA; nenhum orçamento foi alterado.

| Marco | Resultado |
|---|---:|
| close começou | 1060806248698600ns |
| waitFor retornou | 1060806249415600ns; 0,717ms após início; isAlive=false |
| Confirmação TCP retornou | 1060808425358500ns; inspeção/lançamento/observação em 2.175,943ms |
| close retornou | 1060808425360400ns; total de 2.176,662ms |
| Deadline da fase | 1060816248706999ns; 7.823,348ms disponíveis ao confirmar |
| Bind começou | 0,1023ms após close, mesma porta |
| Bind terminou | 0,4143ms de bind, uma tentativa |

O snapshot identifica o listener substituto como pertencente à JVM do teste,
confirmado pelo oracle independente. Depois de fechá-lo, uma requisição ao
endereço antigo recebeu ConnectException. Serviço alheio continuou respondendo
UNRELATED e recebeu somente o hit previsto; amostra posterior vazia. Os 2,176s
incluem criar PowerShell, consultar e observar; não medem a latência física de
liberação pelo kernel.

Na execução intermediária, falha controlada de inspeção gerou
IllegalStateException antes do bind/INDEPENDENT_CLEANUP. Mutação do helper e
reversão do App restauradas por SHA antes do controle corrigido.

## Dois erros históricos preservados

Reexaminados os XMLs/logs originais em
tasks/evidencias/revalidacao-preparacao-local-adocao/:

| Ocorrência | Porta/PID | Evidência disponível |
|---|---|---|
| PG17/JAR | 59466 / 19268 | Address already in use: bind na linha 32, depois de prontidão e assertion de processo encerrado |
| PG16/JAR | 54538 / 66060 | Mesmo ponto do contrato e BindException |

Nenhum contém tabela TCP contemporânea, estado do listener, nascimento exato do
PID, família nativa, errno Winsock bruto ou instante monotônico do bind.

**Reconstruído:** comandos/JAR/configuração, porta, método, ordem das assertions
e exceção. **Compatível:** janela de término anterior à limpeza de endpoints,
reproduzida agora no mesmo contrato e em sintéticos. **Não comprovado
retrospectivamente:** que cada ocorrência teve as mesmas tuplas ou causa
exclusiva. Não se transfere a nova captura aos horários antigos nem se afirma
WSAEADDRINUSE 10048 bruto.

A [documentação Microsoft sobre reuso/exclusividade](https://learn.microsoft.com/en-us/windows/win32/winsock/using-so-reuseaddr-and-so-exclusiveaddruse)
explica que fechamento e possibilidade de reuso podem ocorrer em momentos
distintos. Isso fundamenta a interpretação; a prova causal vem dos experimentos
locais. Não se alteraram SO_REUSEADDR/SO_EXCLUSIVEADDRUSE ou política do sistema.

Fontes novas: snapshots/window, recibos de restauração e relatórios em
[execucao](execucao/); cálculos e SHA em
[analise-independente.json](analise-independente.json).
