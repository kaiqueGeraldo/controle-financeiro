# Reconciliação Git

Consulta em 28/10/2026, origin
`https://github.com/kaiqueGeraldo/controle-financeiro.git` (fetch e push cadastrados).
A primeira consulta sem rede disponível falhou por resolução de host; o fetch
autorizado seguinte atualizou somente `refs/remotes/origin/main`, com sucesso.
Não houve push ou atualização automática da main local.

| Referência | SHA completo | Relação observada |
|---|---|---|
| origin/main consultada | fb986456a37a48afcafef204f165d15354294d26 | Base remota atual da consulta |
| Merge-base com candidato | fb986456a37a48afcafef204f165d15354294d26 | Sem divergência real |
| main local | 272001f7b4c39aebd18bdcd856109f9a0f6c1213 | 29 commits atrás de origin/main; mantida |
| Candidato recebido | 56eb80b5cb867539d94995ec58b63ce2dbc519fa | 48 exclusivos; 0 exclusivos da main |
| Produtor dos inputs p05 | 24844b594e4ed8fe906e0fc6eaee32bdd58f31a0 | Ancestral; produto equivale ao candidato, scripts/testes posteriores diferem |
| codex/revisao-prontidao-cf034-cf017 | 46b85ee0428abb55c22d27d26284d054410ec128 | Contida no candidato; ainda fora da main |
| codex/preparacao-local-adocao | 3b245d9dd23e876700507718767827ea5e9f8a11 | Contida no candidato; ainda fora da main |
| codex/diagnostico-tcp-nativo | c091abb8aa0473e7ad46690e21c8158a4dde234a | Contida no candidato; ainda fora da main |
| codex/diagnostico-startup-hql | 56eb80b5cb867539d94995ec58b63ce2dbc519fa | Contida no candidato; ainda fora da main |

Todas as17 branches locais da fotografia inicial são ancestrais do candidato,
incluindo a nova branch no mesmo SHA. As11 branches CF014–CF034 anteriores e main
local também estão contidas na main remota. Nada precisa de merge/cherry-pick
para compor o lote. As referências remotas de branches antigas não foram
atualizadas; a conclusão usa os tips locais explicitamente registrados.

A integração anterior CF034 não foi deduzida apenas pelo nome: seu tip ddd5a414
é ancestral da main e suas árvores completas são iguais. Os hashes das árvores
estão em [reconciliacao-git.json](reconciliacao-git.json). Não houve squash a
reconciliar neste caminho, nem ausência de conteúdo inferida de ancestralidade.

## O que está acumulado

[Lista dos48 commits com SHA/assunto, 33 caminhos de código e grupos de evidência](reconciliacao-git.json).
Comando de reprodução da lista: `git log --reverse --format='%H %s'
fb986456a37a48afcafef204f165d15354294d26..56eb80b5cb867539d94995ec58b63ce2dbc519fa`.

O delta recebido tem11.310 arquivos/972.920 inserções/26 remoções. Seu material
no working tree soma133.549.194bytes; o maior arquivo tem8.514.699bytes. Isso
não é tamanho de pack/upload. O volume vem principalmente de snapshots e
evidências históricas. Preservá-los custa transferência/revisão, mas apagá-los ou
reescrever commits violaria o pedido. Esta consolidação referencia manifests
por hash e só inventaria os44 arquivos do runtime novo.

## Branch e estado

A branch `codex/consolidacao-pre-adocao` não existia. Foi criada do HEAD recebido,
preservando ` M README.md`; index inicial vazio. O primeiro pedido de criação
sem permissão de escrita em `.git` falhou sem mudar refs; a criação autorizada
seguinte passou. Não houve auto-review rejeitado ou necessidade de descartar arquivo.

Commits novos necessários: provas reproduzíveis, parecer/erratas/estados e recibo
final de preservação. Todos são locais e usam staging explícito. O SHA do commit
final não pode constar do próprio conteúdo; a entrega final informa o SHA e o
intervalo completo `fb986456a37a48afcafef204f165d15354294d26..HEAD-final`.
Consultar também `git log --oneline 56eb80b5..codex/consolidacao-pre-adocao`.

## Se a main mudar depois

Antes de publicar, novo fetch/consulta, merge-base e delta por conteúdo. Se a main
continuar ancestral, atualizar somente a constatação. Se divergir, preparar merge
local em lote autorizado, preservar ambos os históricos e revalidar as interfaces
que mudarem; não atribuir estes aceites à combinação nova. Sem reset/rebase/squash,
force, descarte de branches ou aceite automático por ausência de conflito textual.
