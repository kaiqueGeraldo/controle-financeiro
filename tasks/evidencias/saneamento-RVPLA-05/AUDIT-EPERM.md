# Diagnóstico próprio do audit

A falha histórica foi `fs.renameSync`, EPERM/errno-4048, publicando `mailbox-9b8cc9b2-0a42-4fc3-9f25-d49745066659.json.<UUID>.tmp` sobre `mailbox-9b8cc9b2-0a42-4fc3-9f25-d49745066659.json`, dentro de `.owned-runs` da revisão RVPLA-04. A pilha parte de `atomic`→`request`→`verifyOwnedBoundary` no worker, depois do registro e antes de certificar o audit. Não foi erro de kill/PID nem evidência de processo já encerrado. A captura histórica não contém inventário de handles/token; não é possível identificar retrospectivamente seu detentor.

## Experimentos finitos

`rvpla05-eperm-02` manteve a mesma operação de publicação (criação exclusiva do tmp, escrita, fsync, close e rename). Na identidade ALUGA-072061\Aluga.com, SID S-1-5-21-1718877253-2242848675-3470680120-1003, token sem elevação administrativa:

| Controle | Resultado |
|---|---|
| Arquivo sem leitor | rename passou,2,899ms |
| Node segurando descriptor aberto com `fs.openSync(path,'r')` e leitura, flags padrão usados pelo broker | EPERM/-4048 em rename,2,657ms |
| FileStream .NET FileShare.Read, sem Delete | Mesmo EPERM,2,967ms; owner do arquivo igual ao SID efetivo, atributo Archive |
| Fechamento determinístico do holder .NET | O mesmo tmp pendente foi renomeado uma vez com sucesso, como controle pós-mudança independente de estado |

A primeira versão delimitada `rvpla05-eperm-01` falhou no observador ao resolver Get-Acl; seu `finally` fechou o FileStream. Não foi gate do harness nem prova da hipótese. O observador seguinte consultou o proprietário pela API .NET. Os arquivos/saídas intermediários foram mantidos. Não houve elevação, mudança de ACL, atributo, privilégio global ou retry no produto.

O experimento foi então levado ao **harness real**: após o registro, antes da inspeção do audit, outro processo Node abre a mailbox publicada e conserva o descriptor até o worker decidir. `reader.json` registra PID leitor, caminho, inode/device, hash dos bytes, owner PID+nascimento+sessão do controller e hash do módulo. Os processos são criados sem troca de usuário/impersonação; o contexto de identidade acima é o do experimento, não um token histórico inventado. O worker falha na publicação com o mesmo EPERM e não certifica quiescência (`rvpla05-audit-reader-before-01`).

Com a correção, `rvpla05-audit-reader-after-01` certifica a fronteira mediante inspeção nativa, ainda com o descriptor anterior aberto. Na contraprova `rvpla05-audit-causal-01`, somente o módulo antigo de mailbox foi recolocado; guardião rápido e inspeções físicas foram mantidos. O oracle original de publicação ficou vermelho pelo motivo `AUDIT_PUBLICATION_REPLACED_OPEN_READER`, com EPERM/rename. Após restauração SHA-256, passou verde. Não é teste vermelho por permissão da ferramenta, import, timeout ou falta de banco.

## Correção e custo

Cada worker publica um slot único e sequencial por solicitação, com UUID, runId e sequence. O controller conhece o próximo nome, lê em O(1) em relação ao histórico e valida a sequência/UUID. Cada poll também confere o SHA do slot ativo: parse inválido, remoção ou alteração cancela a árvore, inclusive durante comando em andamento. Recibos de Job, rosters e inspeções continuam necessários. Protocolo4 recusa mistura com recibo ativo incompatível; identidades de observação antigas não recebem promoção. Não se converte EPERM ou erro de inspeção em `quiescent`.

O espaço das publicações passa a O(n) slots no histórico da execução (já havia check/reply imutáveis O(n)); custo por poll depende só do tamanho do slot ativo, não faz varredura O(n). O trade-off é reter mais um arquivo pequeno por solicitação para evitar substituir um arquivo aberto. Os arquivos ficam no runtime auditável; não se adicionou serviço persistente ou cleanup que apague prova.

Diagnóstico: **corrida de substituição demonstrada no harness e corrigida localmente**, aguardando revisão. Atribuição exclusiva da ocorrência histórica continua inconclusiva pela ausência de captura de handles. O novo audit real será relatado separadamente no resultado da execução PG17, sem tornar esse diagnóstico uma aprovação geral do runner.

[CreateFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) documenta a relação entre compartilhamento de exclusão e operações de rename. A prova principal aqui é o descriptor realmente aberto no experimento e o teste causal com o módulo antigo, sem inferir apenas a partir do nome EPERM.
