# CF-030 — publicação anterior e preservação

Destino conferido: `https://github.com/kaiqueGeraldo/controle-financeiro.git`.
Base anterior de origin/main: `dd554d188976144ccf00e00f9b20242196f70d90`.
O lote aprovado continha nove commits até
`5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`, sem divergência ou commits posteriores.

Por autorização expressa, a branch `codex/cf029-onboarding` foi publicada com
upstream, main local avançou por fast-forward ao lote aprovado e main foi
publicada. Sem force/rebase, PR, exclusão de branch ou conflito. A nova branch
`codex/cf030-aplicacao-onboarding` foi criada dessa main integrada. Nenhum commit
CF030 foi enviado ao remoto, nem foi configurado upstream para essa branch.

Conferência remota em20/10/2026 durante o fechamento:

```text
5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251 refs/heads/main
5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251 refs/heads/codex/cf029-onboarding
```

A consulta da branch CF030 não retornou referência remota. Gatilhos automáticos
do push anterior estavam autorizados; não se executou deploy manual, ativação de
serviços/writers ou migração de banco real. A única worktree continua sendo o
checkout original; contraprovas são cópias sem `.git` no diretório dedicado.

## Preservação

README raiz já estava modificado ao começar. Hash SHA256 inicial e reconferido
após publicação/trocas e antes do fechamento:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Esse arquivo fica fora de todos os commits. `.cf22/`, `.cf22r/`, `.cf22s/` continuam
fora do staging. Runtimes em target e demais ignorados não foram removidos;
compilação escreve os artefatos usuais em target, sem limpeza geral. Evidências e
aceites anteriores foram preservados. V1–V15 permanecem sem diff.

`preservation-verified.json` reconferiu4123 arquivos dos três diretórios `.cf22*`
contra `excluded-before-commits-sha256.json`, com SHA256 e inventário idênticos.
Também registrou o README e o staging restrito ao primeiro grupo de implementação.

O staging é feito por caminhos explícitos, separado em implementação de src/main,
testes/scripts de src/test e documentos/evidências CF030. Conferir o diff de cada
grupo antes do commit; nunca `git add .`. O estado final deve ter staging vazio e
somente as alterações preexistentes fora do lote.

## Intervalo de revisão

Commits locais já identificados:

- `9e54af9ae8bfbe9dca2dbfffe89ff578ce1837a7`: implementação,46 arquivos de src/main.
- `2bc67518dba32b3389c51365d75f7984decbd36f`: testes/scripts,19 arquivos de src/test.
- O commit documental que contém este arquivo fecha o intervalo, com evidências,
  explicitação de Summary, estado em_revisao e roteiro independente.

Revisar **todo** `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251..HEAD` na branch CF030,
incluindo implementação, testes e evidências. A entrega da conversa identifica
os hashes dos três commits locais; o commit documental não pode conter o próprio
hash. Resolver HEAD no checkout entregue e conferir:

```powershell
git log --oneline 5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251..HEAD
git diff --stat 5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251..HEAD
git diff --cached --name-only
Get-FileHash -LiteralPath README.md -Algorithm SHA256
git ls-remote --heads origin main codex/cf029-onboarding codex/cf030-aplicacao-onboarding
```
