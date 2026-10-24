# Registro de execução — 24/10/2026

Base de entrada e produto integrado: `e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`.
Fuso de registro: America/Sao_Paulo. Sem execução de suíte, build, CI manual ou
ensaio funcional nesta análise documental. Nenhum resultado histórico é contado
como nova execução.

## Integração autorizada

1. `status --porcelain=v2`, `diff --cached --stat`, `branch -vv`, `worktree list
   --porcelain`, `rev-parse HEAD`, remotes/pushurl e SHA256: staging vazio, só
   README raiz modificado; um worktree; nenhuma alteração posterior ao aprovado.
2. Backup recuperável do README em `%TEMP%/cf015-zoom-gate-cf034-20261024/README.preexisting.md`;
   cópia e original com hash histórico idêntico. Não foi necessário stash ou
   restauração: README tem o mesmo blob versionado nas bases atravessadas.
3. `git fetch origin`: primeira tentativa recusada por `.git/FETCH_HEAD:
   Permission denied`; repetição com permissão apropriada, **exit 0**. Não houve
   rejeição de revisão automática de aprovação.
4. `rev-list --left-right --count origin/main...e1a01b6`: **0 / 7**;
   merge-base `bfb6c61`. Conferidos sete commits, quatro arquivos de produto,
   testes/evidências/pareceres e estados. README raiz ausente do intervalo.
   [Lista integral](intervalo-publicado.json), [estado inicial](estado-inicial.json).
5. `diff --check bfb6c61..e1a01b6`: apontou whitespace nos logs/XML/TXT históricos;
   preservados sem reformatar provas. A checagem dos documentos novos é separada.
   `diff --quiet e1a01b6 --` produto/tasks/docs/workflows: exit 0 antes dos novos arquivos.
6. `git push --set-upstream origin e1a01b62e0766c92120c3cefc2bc4b4fc316ce58:refs/heads/codex/cf033-revisao-integrada`:
   **exit 0**, branch criada. Upstream local definido explicitamente depois por
   `branch --set-upstream-to=origin/codex/cf033-revisao-integrada`.
7. `switch main`; `merge --ff-only --quiet origin/main`; `merge --ff-only --quiet
   e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`: **exit 0** em cada etapa.
   README conferido com hash histórico após troca/integração.
8. `push origin refs/heads/main:refs/heads/main`: **exit 0**, `bfb6c61..e1a01b6`.
9. `ls-remote --heads origin main codex/cf033-revisao-integrada codex/cf015-zoom-gate-cf034`:
   **exit 0**; main/CF033 em `e1a01b6`, branch futura ausente.
10. Ausência da branch local confirmada; `switch -c codex/cf015-zoom-gate-cf034
    e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`: **exit 0**. Sem upstream para a
    nova branch. Nenhum force push, rebase, conflito, PR ou exclusão de branches.

[Resultados consolidados de Git](integracao.json). O aviso automático do GitHub
ofereceu criar PR; nenhum PR foi criado. Gatilhos decorrentes do push foram
autorizados pelo usuário; estado/êxito de CI, Vercel e Railway não foram consultados
nem presumidos. Nenhum deploy manual ou acesso a banco real.

## Preflight e limites

[CAPACIDADES](CAPACIDADES.md) registra as chamadas realmente usadas e o bloqueio.
Não foi executado o probe histórico de zoom: faltou capacidade de captura/input
nativo antes de preparar o produto. Não foi produzido `native-confirmed.txt`.

Leituras de caminhos supostos inexistentes (`ci.yml`, diretório `04-qualidade`,
`fechamento.../ZOOM.md`) foram substituídas pelos arquivos encontrados com `rg`;
não são falhas de produto. A primeira geração do manifesto de preservação parou
ao ler nomes Unicode escapados por Git; corrigida a **leitura** com
`git -c core.quotepath=false ls-files`, sem renomear ou alterar arquivos.

Pareceres e proposta em commit posterior às provas. Revisão independente das
futuras provas de produto permanece exigida por `tasks/EXECUCAO.md`.

## Preservação e comparação de bytes

O snapshot pós-integração cobre 9.663 arquivos versionados de produto, testes,
documentação e evidências e reconfere os 627 caminhos do manifesto histórico.
Todos existem. Há 67 diferenças brutas em arquivos **do repositório**, sem delta
Git: 10 correspondem ao hash histórico após CRLF→LF; as outras 57 não são
reconstruídas por essa transformação simples. Não se atribui com certeza o
momento dessa diferença porque não houve novo hash de todos esses caminhos antes
das trocas de branch. `core.autocrlf=true` e os filtros Git são relevantes.

Para cada um dos 67, `git hash-object --path=<relativo> -- <arquivo>` coincide
com o blob tanto em `d059bc9` quanto em `e1a01b6`. Isso prova igualdade do conteúdo
versionado sob os filtros Git; **não prova identidade bruta com o manifesto
antigo**. Nenhuma restauração ou reformatação foi feita. A primeira comparação
LF usava ReadAllText; foi repetida preservando BOM nos bytes, sem mudança da
classificação. [Dados e blobs](historico-eol.json). Os runtimes não apresentam
essas divergências brutas. O fim desta rodada é comparado ao snapshot
pós-integração, distinguindo as notas canônicas deliberadamente atualizadas.
