# Orçamentos, identidade e limite da garantia

## Prazo e observadores

No ramo Windows/JAR/porta conhecida, o prazo de 10s começa antes de destroy.
waitFor e cada inspeção recebem o restante dessa fase. Somente se o processo
não terminar nessa espera ocorre destroyForcibly, seguido da fase de 5s já
existente. A consulta TCP não recebe 5s/10s novos por iteração; falhas não
reiniciam o prazo.

Sucesso exige inspetor encerrado, exit 0, JSON válido, inspected=true,
ownedRows inteiro não negativo e igual a zero, antes do deadline. O helper não
faz bind. Espera de até 100ms somente entre consultas com tuplas; consulta e
espera sequenciais, sem inspetores concorrentes criados pelo loop.

**Limite material:** em erro/timeout, o próprio inspetor é terminado pelo handle
e pode receber **até 2s adicionais de limpeza**. Esse prazo não permite sucesso
tardio. Preservado o orçamento para certificar a liberação; não se afirma retorno
absoluto de erro sempre abaixo de 10s/5s. Encerrar um recurso próprio tem
preferência sobre sair deixando um observador ativo; o custo adicional fica
explícito. Não é retry de bind nem ampliação do startup de 40s. No controle
positivo completo, close retornou em 2,177s, dentro de 10s.

O complemento instrumentou somente a cópia do helper, mantendo checks e
deadlines; override da query é específico dos cenários simulados. Originais
PG16/17 usaram helper sem instrumentação. Nas onze chamadas complementares,
foram dezesseis inspetores, todos com término observado e o mesmo deadline em
todas as consultas de cada chamada. O observador nativo da prova também terminou.

| Caso complementar | Chamadas/resultado | Tempo observado |
|---|---|---:|
| Porta livre, bind na mesma porta | Uma liberação válida / uma consulta | 2.126,042ms |
| Endpoints originais liberados | Uma liberação válida / uma consulta | 2.465,782ms |
| Substituto com outro PID escutando | Ausência dos endpoints originais; colisão seguinte explícita; substituto vivo | 2.142,292ms da inspeção |
| Listener IPv6 próprio | Bloqueado, duas consultas no mesmo prazo de 4s | 4.013,772ms, erro/limpeza |
| ESTABLISHED próprio sem LISTEN | Bloqueado, duas consultas no mesmo prazo de 4s | 4.009,916ms, erro/limpeza |
| Sem confirmação / contagem negativa / JSON parcial | Três bloqueios | 330–439ms |
| Erro explícito da inspeção | Bloqueado | 509,800ms |
| Condição retida simulada | Bloqueado, quatro consultas / prazo de 1,8s | 1.803,516ms |
| Inspetor lento de 20s | Bloqueado, prazo de 500ms, inspetor terminado | 515,820ms |

Pequenos excessos nos tempos de erro incluem limpeza/escalonamento; não foram
subtraídos ou usados para certificar sucesso. Intervalos observados entre
inícios das queries retidas: 453–506ms nas respostas sintéticas e 2,22–2,52s nas
consultas completas. O custo dominante é criar/consultar PowerShell/CIM. Não se
observou polling ocupado. Consulta da tabela com n endpoints tem custo O(n) por
amostra e materialização O(n) no PowerShell; o prazo limita as iterações. Não há
delta de queries financeiras/N+1 ou motivo para alterar arquitetura do produto.

## O que a amostra sustenta

[Get-NetTCPConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-nettcpconnection?view=windowsserver2025-ps)
fornece propriedades de conexão, estado, endereços e portas. O helper consulta a
tabela inteira e seleciona PID com LocalPort **ou RemotePort** igual à porta,
sem restringir LISTEN, endereço ou família. Isso é conservador: conexão sem
listener ou em outra família ainda pode bloquear. Complementos reais IPv6 e
ESTABLISHED confirmam o comportamento. Não se prova que toda tupla impediria bind.

Snapshot válido vazio difere de erro de enumeração, JSON parcial ou falta de
confirmação. Os negativos bloquearam esses casos. Dados/consulta indisponíveis
não são convertidos em porta livre. Uma amostra tem custo e atraso, não mede o
instante exato de liberação pelo kernel. A regra não exige estado específico
como TIME_WAIT.

## Identidade, substituto e alheios

O processo encerrado é o objeto Process criado pelo harness; destroy/force usam
esse objeto. O inspetor é outro Process próprio. Não há kill por nome, porta ou
PID genérico. PID/nascimento/log/porta da JVM foram registrados antes do término
nas provas. O [identificador de processo tem validade ligada à sua vida](https://learn.microsoft.com/en-us/windows/win32/procthread/process-handles-and-identifiers);
uma tupla TCP não contém nascimento. O helper filtra pelo PID original, sem
reconstruir identidade de processo morto ou prometer imunidade à reutilização de
PID. Um PID reciclado com tuplas coincidentes pode bloquear conservadoramente;
isso não autoriza terminação nem identifica nova aplicação como antiga.
Não foi forçada reutilização real de PID.

No complemento, um processo sintético terminou e outro PID passou a escutar na
mesma porta. A inspeção confirmou apenas ausência dos endpoints do original. O
próximo bind único falhou com BindException; o substituto permaneceu aberto e
aceitou conexão. Não se atribuiu seu listener ao antigo pelo número da porta nem
se o encerrou para obter aprovação. Os métodos originais também verificaram que
HTTP 200 alheio não é prontidão da aplicação e que o serviço segue respondendo.

Ausência de tuplas próprias não reserva atomicamente a porta. Colisão externa
entre inspeção e bind continua possível e falha explicitamente. Não se exige
garantia contra terceiros arbitrários nem se afirma exclusividade maior que as
opções/runtime e provas sustentam. SO_REUSEADDR do probe original permaneceu
true, sem novo relaxamento de opções ou configuração global.

Ramos Docker, não Windows e porta zero não mudaram. O aceite não se estende a
supervisor Linux nativo, daemon delegado ou toda morte possível do executor.
RVPLA-01/03/04/05 e EPERM mantêm seus recortes por diff/hashes. Probe sintético de
retomada em 20s usa fixture Maven e não executa App.close; não foi repetido sem
impacto concreto. Startup HQL permanece inconclusivo, com 40s.
