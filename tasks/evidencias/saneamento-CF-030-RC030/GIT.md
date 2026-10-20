# RC030 — Git e preservação

Branch mantida: codex/cf030-aplicacao-onboarding.
Base de saneamento:251d6c70492e4ad57dc9ca1313dce17afab62464, com os commits da revisão
76580e1/251d6c7 preservados. Nenhum commit posterior encontrado ao iniciar.
Uma worktree, staging vazio, README raiz modificado e três diretórios preexistentes
não rastreados. Nenhum checkout, push, merge, rebase ou exclusão de branch.

Commits locais separados por achado:

- f54934e3f6835a1da8a484a9ee4ed0a3e4e92e99 — RC030-01, distribuição compartilhada e controles.
- 64bcbd31838c743637489885751b0673817c8ff2 — RC030-02, ciclos/datas civis e observador demonstrado.
- 745c4d9846c4f39517573de48ff3a613e263b7ba — RC030-03, faixa numérica e contratos HTTP.
- O commit documental que contém este arquivo fecha o intervalo e inclui runners,
  logs, hashes, falhas, estado em_revisao e encaminhamento de revalidação.

Intervalo completo do saneamento: **251d6c70492e4ad57dc9ca1313dce17afab62464..HEAD**.
O hash do último commit é fornecido na entrega, pois o arquivo não pode registrar
o hash do próprio commit. O histórico CF030 anterior permanece ancestral.

README inicial/final esperado:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Fora do staging em todos os grupos. preservation.json registra83 arquivos
independentes (82 inalterados e original do observador preservado),4123 arquivos
.cf22/.cf22r/.cf22s e binários java/javac com hashes anteriores idênticos.
Migrações existentes inalteradas, nenhuma nova migração e nenhum backfill.
JDK/target reutilizados, sem limpeza geral. Nenhum deploy ou acesso a banco real.

```powershell
git log --oneline 251d6c70492e4ad57dc9ca1313dce17afab62464..HEAD
git diff --stat 251d6c70492e4ad57dc9ca1313dce17afab62464..HEAD
git diff --cached --name-only
Get-FileHash -LiteralPath README.md -Algorithm SHA256
```
