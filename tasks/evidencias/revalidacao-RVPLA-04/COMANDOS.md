# Execução e leitura das provas

Rodada concluída em Windows, mesma sessão. Esta sequência registra os comandos
usados; não é autorização para repetir o audit até passar. As pastas e os logs
entregues devem ser preservados. Nenhuma correção de implementação foi aplicada.

## Ambiente e identidade

PowerShell, Node24.18.0, Maven3.9.12, Temurin21.0.12.1+1; Docker Desktop local.
O JAR anterior foi preservado; a imagem local anterior foi reutilizada. O preflight
usa PostgreSQL17 descartável, sem banco real ou pacote novo.

```powershell
$taskRepo = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro'
$taskRoot = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\revalidacao-rvpla04-20261027-01'
$env:JAVA_HOME = Join-Path $taskRepo 'controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor 3a6e95be68678e394cd718d9d688fab1fdc428ce badecb55e45eb80eec6d7dc435b9afcfe4a8106d
git diff --name-status 3a6e95be..badecb55
git status --short
git diff --cached --name-status
```

No início, HEAD era exatamente badecb55 e somente README raiz estava modificado.
Os commits desta revisão são descendentes documentais/de provas. Uma reprodução
exata exige checkout isolado do candidato com os scripts de revisão copiados do
commit32d445e32c47ca16bd840aaa7b99fe46f919150b, sem mudar os módulos examinados;
não se deve resetar esta working tree. `prepare.mjs` registra HEAD: não atribuir
o manifesto antigo ao HEAD documental atual. Os snapshots de preservação têm
caminhos históricos deste computador; não são um instalador portátil.

## Sequência finita da rodada entregue

Cada comando abaixo foi executado uma vez na sua finalidade. O destino inicial
não existia. Para qualquer reprodução futura, é obrigatória outra pasta nova
com prefixo `revalidacao-rvpla04-`, nunca esta execução já concluída. Gravações
no diretório irmão foram executadas com a permissão de escrita correspondente.

```powershell
node tasks/evidencias/revalidacao-RVPLA-04/preservar.mjs inicial
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/executar.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/abandono.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/recuperar-legado.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/canal.mjs $taskRoot
./tasks/evidencias/revalidacao-RVPLA-04/real.ps1 -Runtime $taskRoot
```

`executar.mjs` publica adaptação/hash dos drivers e conserva os testes originais:
reprodução antiga, contrato vermelho, 43 controles, contraprova antiga/controle
corrigido, original aplicado ao bloqueio atual, 2 falhas, 4 broker e antes-do-filho.
Só destinos e cópias de fontes ancestrais são redirecionados. A inadequação do
original como oracle positivo foi demonstrada antes do complemento: o bloqueio
correto retém `mutant`, enquanto sua pré-condição exige `original`.

A primeira versão de `abandono.mjs` parou por erro próprio de sintaxe, antes de
criar atores. Fonte arquivada em `abandono-v1.mjs.txt`, saída em
`execucao/abandonment.log`; a versão corrigida do observador gerou
`execucao/abandonment-02.log`. Isso não é uma falha detectada no candidato.
A versão entregue executa o original20s na base/candidato e o diagnóstico até60s
na base/candidato/versão vulnerável. Limite e critérios originais permanecem
intactos. O complemento detectou a violação antiga; seu prazo maior não aprova
o original falho. `recuperar-legado.mjs` recupera a fixture interrompida em outra
geração e conserva os bytes/checkpoints anteriores; não repete o gate20s.

`real.ps1` passou no preflight causalPG17 e no resume. Parou no audit com EPERM
na substituição da mailbox. Não chegou ao controle de identidade nem escreveu
`real-result.json` de sucesso. A identidade foi então executada separadamente:

```powershell
node "$taskRoot/tools/tasks/evidencias/saneamento-RVPLA-04/identity.mjs" "$taskRoot/identity" $taskRoot
```

Sua saída está em `real-identity.log`, resultado em `identity/results.json`:
recusa, checkpoint com o mesmo SHA e nenhuma nova tentativa. O audit não foi
repetido. A causa do EPERM permanece desconhecida, inclusive tendo ocorrido
dentro de uma execução com permissão para a pasta externa.

## Coleta, preservação e auditoria de entrega

```powershell
node tasks/evidencias/revalidacao-RVPLA-04/analisar-custo.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/recursos.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/coletar.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-04/auditar.mjs --staged
```

A primeira gravação do analisador de custo foi negada na pasta irmã. A mesma
análise foi gravada com permissão em seguida; nenhum teste foi reexecutado por
isso. Não há log próprio desse erro de gravação na coleta: o registro é a saída
da ferramenta nesta conversa. É uma ocorrência distinta do rename do audit.

`coletar.mjs` exige manifesto do candidatobadecb55 e verifica os834 inputs
restaurados. Publicou877 artefatos e seus hashes original/coletado. Textos têm
decodificação/sanitização declaradas; nomes longos foram compactados sem mover
originais. Não executar novamente contra o diretório de evidências entregue.
Uma mailbox propositalmente inválida é preservada como tal, com hash e marcador,
sem fingir validação JSON. `auditar.mjs` lê fontes/cópias, verifica bytes e sintaxe,
sem executar testes. `--staged` também conferiu os877 blobs antes do commit de provas.

Depois do commit de provas32d445e e da redação do parecer/estados, foram usados:

```powershell
node tasks/evidencias/revalidacao-RVPLA-04/preservar.mjs final
node tasks/evidencias/revalidacao-RVPLA-04/auditar.mjs
git diff --check -- tasks
Get-FileHash -LiteralPath README.md -Algorithm SHA256
git diff --cached --name-status
```

Os snapshots `inicial`/`final` são exclusivos, não sobrescrevíveis. A fotografia
final registra o HEAD de provas antes do commit documental; o HEAD de entrega
é informado na resposta final, evitando autorreferência no próprio commit.
Staging explícito: provas em um commit; sete documentos, preservação final e
quatro notas de estado no seguinte. README raiz alheio fora dos dois commits.
Sem nova rodada de testes após a redação, sem push/merge/CI remota/deploy.
