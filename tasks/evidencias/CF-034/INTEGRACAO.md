# Base documental publicada e início local

24/10/2026, America/Sao_Paulo. Entrada confirmada:
`codex/cf015-zoom-gate-cf034`, HEAD `79ce0895630f025cce898950797df66f391bfa09`.
Staging vazio, somente README raiz preexistente modificado. Um worktree, remoto
fetch/push `https://github.com/kaiqueGeraldo/controle-financeiro.git`, sem upstream
na branch documental antes da publicação.

O diff `e1a01b6..79ce089` contém apenas tasks/provas/documentação; nenhum produto,
workflow, runtime ou README raiz. DEC-CI-04 formalizada separadamente em
`272001f7b4c39aebd18bdcd856109f9a0f6c1213`.

`fetch origin` aprovado; `origin/main...HEAD`=0/3. Publicação da branch documental,
atualização de main por `merge --ff-only origin/main`, integração por
`merge --ff-only 272001f` e push main: todos exit0. Conferência direta `ls-remote`:

```text
272001f7b4c39aebd18bdcd856109f9a0f6c1213 refs/heads/codex/cf015-zoom-gate-cf034
272001f7b4c39aebd18bdcd856109f9a0f6c1213 refs/heads/main
```

Branch `codex/cf034-ci-local` inexistente local/remotamente, criada dessa base.
Nenhum force, rebase, PR, conflito ou exclusão de branch. Implementação não
publicada. Gatilhos automáticos aceitos, sem alegação de seu resultado ou deploy.
Nenhum deploy manual, writer, notificação real ou banco real.

README inicial e após trocas:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Permaneceu no workspace, fora do staging/commits. Não foi restaurado.

Infraestrutura local inicial: Node24.18.0, npm11.16.0, Temurin21.0.12.1+1,
Docker29.6.2, nenhum container em execução. A consulta Docker sem acesso ampliado
recebeu permission denied no named pipe; consulta autorizada confirmou o daemon.
JDK instalado preexistente em target foi somente lido; não houve clean geral.
