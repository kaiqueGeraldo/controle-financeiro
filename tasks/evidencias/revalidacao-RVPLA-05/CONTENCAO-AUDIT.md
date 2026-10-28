# Contenção, protocolo e audit

## Saída rápida não substitui ausência confirmada

O Job privado é criado/configurado com KILL_ON_JOB_CLOSE, sem breakaway, e o
guardião entra nele antes de criar worker/adaptador/executável. O único handle
duradouro do Job pertence ao guardião, não aos filhos. Consultas externas abrem
handles temporários; o cenário de handle retido mostra por que Job vazio e
objeto ausente são estados distintos. `Finish` só usa o pseudo-handle do próprio
guardião nomeado. O kernel fecha seus handles; retorno de comando só ocorre
depois de close e da confirmação externa de Job ausente.

| Condição | Resultado verificado |
|---|---|
| Wrapper termina antes de filho/neto | Grupo privado contém os descendentes, ausência confirmada antes do resultado |
| Job sem processos, handle externo retido | Não aceita ausência; bloqueia retorno/recuperação até liberação |
| Runner/guardião/canal termina | Pipes privados cancelam a árvore; fechamento é verificado separadamente |
| Inspeção desconhecida/operacional | Não vira lista vazia, sucesso ou quiescência |
| Handoff com criação durante inspeção | Oracle antigo vermelho; corrigido mantém mutant/restoration-pending, sem complete ou próximo gate |
| Recuperação | Só nova geração após ausência dos Jobs, identidade e reobservação; fontes restauradas por hash |
| Outra execução/mesmo nome | Preservada; mutex recusa segundo dono da mesma raiz sem parar primeiro |

As provas dirigidas passaram:4 broker,1 antes-do-filho,2 inspeções,5 identidades/
boot,2 canal,43 controles e consumidor compartilhado sem Job nomeado. Há
sobreposições entre esses grupos. O ProofStore e consumidores não foram alterados
pelo delta; exceções/finally não promovem falta de prova a complete. Os cenários
dirigidos sustentam RVPLA-03/04 específicos. Os probes de abandono completo e
de retorno20s que falharam não foram convertidos em aceites funcionais.

## Mailbox: mecanismo causal aceito

No protocolo antigo, o worker publicava cada request por tmp/write/fsync/close/
rename sobre o mesmo destino. O leitor podia conservar um descriptor sem delete
sharing, impedindo essa substituição no Windows. Na contraprova independente,
somente o módulo de mailbox antigo foi recolocado em cópia: guardião rápido e
inspeções físicas permaneceram. O leitor segurou o arquivo até a decisão do
writer. O harness antigo produziu **EPERM/rename** e o mesmo oracle ficou vermelho
por AUDIT_PUBLICATION_REPLACED_OPEN_READER. Restaurado por SHA, ficou verde com
o descriptor anterior ainda aberto; nenhum privilégio ou ACL foi alterado.

O protocolo4 publica um slot novo por sequência, com runId/requestId/workerPid.
O controller conhece o próximo nome e recusa sequência errada/UUID duplicado;
`serve` verifica execução, modo e worker registrado. O SHA do slot ativo é
rechecado enquanto há trabalho. Cada request tem check/reply imutáveis; respostas
são ligadas ao UUID novo e à raiz da execução. Não há substituição do slot aberto
nem captura genérica de EPERM para conceder sucesso.

Novos controles: mensagem de outra execução em nome de outra mailbox foi
ignorada e a solicitação legítima passou; UUID duplicado, sequência errada e
JSON parcial cancelaram a execução sem certificado. RunId incorreto no slot
esperado recebeu erro operacional explícito, code130 e Job ausente. Um erro
posterior do observador releu o slot já alterado pelo worker; seus recibos
existentes permitiram recuperar a rejeição sem novos atores. O caso de falha de
publicação, ainda não iniciado, foi executado uma vez à parte: nenhum certificado.
Não se apresenta um script6/6 verde. Slot ativo corrompido e recuperação foram
revalidados pelo grupo de canal. Não se demonstrou consumo de resposta antiga
para certificar geração nova nos cenários cobertos; não é defesa contra agente
hostil com acesso irrestrito ao filesystem/processos do mesmo usuário.

[CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)
documenta as restrições de compartilhamento que também afetam rename. A prova
principal é o teste causal com descriptor real, não o nome EPERM isolado.
O detentor do handle da ocorrência RVPLA-04 **continua desconhecido**: não havia
inventário de handles/token na captura. O mecanismo é explicação compatível e
demonstrada, sem atribuição histórica exclusiva ou integral inventada. Essa
lacuna histórica não mantém aberta uma correção causal já demonstrada.

## Audit PG17 e limites

Novo preflight descartável produziu a assertion causal esperadamente falha,
1 teste/1 falha/0 erros/0 skips, e complete legítimo com fontes restauradas.
Resume reutilizou a prova em12,703s; audit confirmou1 prova/0 novos testes em
11,431s; uma tentativa e checkpoint SHA idêntico. Observador divergente recusado
sem tentativa extra. Esses caminhos de reuse/audit têm trabalho diferente da
retomada após abandono; não aprovam por associação o probe20s falho.

Slots acrescentam O(n) arquivos por n requests ao histórico já O(n) de check/reply.
Despacho é O(1) médio em relação ao histórico, sob um worker síncrono/um pedido
em voo; o poll lê só slot ativo/próximo. Contadores/Set consomem O(n) memória,
roster custa O(p) e recovery percorre O(r) recibos. Não há delta de queries,
N+1 ou concorrência financeira. A simplicidade de slots evita substituir arquivos
abertos, ao custo de mais evidência pequena em disco. Término nativo elimina
finalização gerenciada só no guardião descartável; custo restante de consultas
continua relevante e não pode ser removido à custa de certificados necessários.

Alcance: Windows/mesma sessão, criação normal e processos cooperativos. Não
certifica daemon/SQL/WMI universal, serviço delegado ou supervisor Linux nativo.
Docker Linux sobre Windows não amplia esse alcance. TCP/HQL e40s permanecem
independentes. Auditoria final de recursos é leitura, sem término de terceiros.
