# Reconciliação Git e preservação

Consulta independente em 26/10/2026. `consultas-remotas.json` registra a leitura
atual da branch main pela API; o transporte Git do terminal não resolveu DNS.
Não se inferiu o remoto apenas do cache `origin/main`.

| Referência inicial | SHA completo |
|---|---|
| HEAD, codex/cf034-ci-local | ddd5a4143827146e8e3abdb99aba4c101a9fddcd |
| main local | 272001f7b4c39aebd18bdcd856109f9a0f6c1213 |
| origin/main e main atual pela API | fb986456a37a48afcafef204f165d15354294d26 |
| Árvore de ddd5a41 e fb98645 | 0208fbe96400138cc562d8bdad217fa9518c1167 |

`git merge-base --is-ancestor ddd5a41 fb98645` aprova. O merge tem dois pais:
272001f e ddd5a41, exatamente nessa ordem. `git diff ddd5a41 fb98645` é vazio.
`git log --left-right origin/main...ddd5a41` contém somente o merge no lado
remoto. Portanto os 28 commits da PR estão integrados por ancestralidade **e**
conteúdo; não há código/evidência/documentação exclusivos da antiga branch a
transportar. A main local antiga é uma referência desatualizada, não perda de
integração. Não houve reset, rebase, cherry-pick, merge corretivo ou fetch forçado.

Após essa conferência, foi criada `codex/revisao-prontidao-cf034-cf017` diretamente
de fb986456a37a48afcafef204f165d15354294d26. O README modificado acompanhou a troca
porque as duas árvores são iguais. A primeira tentativa de criar a branch foi
recusada pela permissão de escrita de `.git`; a operação local autorizada foi
reexecutada com a permissão correspondente e passou. Não houve rejeição do
revisor automático nem alteração remota.

Estado de entrada: somente ` M README.md`, staging vazio. SHA-256 inicial
6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca,
igual ao histórico solicitado. Esse arquivo fica fora de todos os commits.
`preservacao-inicial.json` registra o hash e os 29 arquivos preexistentes do
runtime referenciado; `preservacao-final.json` confronta esses mesmos bytes.
O inventário de hashes foi gravado depois das consultas iniciais, antes de
qualquer modificação documental dos arquivos preexistentes. Não é um novo
inventário integral de todos os runtimes históricos.

Os commits desta revisão contêm apenas parecer/plano, provas resumidas e
atualizações documentais dos estados; continuam locais. Para integração futura:
reler a main pela API/fetch autorizado, revisar o intervalo exato
`fb98645..codex/revisao-prontidao-cf034-cf017`, proteger a criação de previews antes
de qualquer push e integrar apenas a documentação aprovada. Se a main avançar,
avaliar o delta de conteúdo e os inputs; não atribuir este JAR a uma revisão
nova por compartilhar a branch. Não publicar automaticamente esta branch: ela
não está entre as duas branches bloqueadas em `vercel.json`.

O HEAD exato de entrega é emitido ao concluir os commits locais. O recibo final
registra o HEAD anterior ao próprio commit para evitar hash autorreferente;
`git rev-parse HEAD`, `git log -2` e `git status --short` completam a prova.
