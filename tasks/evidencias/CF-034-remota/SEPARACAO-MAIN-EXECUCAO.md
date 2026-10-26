# Separação autorizada em 26/10/2026

O usuário aprovou explicitamente “Autorizar separação e integração” para a
proposta [SEPARACAO-MAIN-PROPOSTA.md](SEPARACAO-MAIN-PROPOSTA.md): desativar
autodeploy do backend production Railway, adicionar main=false na configuração
Git da Vercel, revalidar o candidato e integrar a PR #1 após os gates.

Railway: botão Disable acionado no projeto/ambiente/serviço identificados na
proposta. A UI confirmou **Auto deploy is disabled**, botão **Enable**.
[Comprovante](railway-autodeploy-desativado.png). Consulta do conector após a
alteração: backend e Postgres sem latestDeployment, stagedChanges=null e
pendingWork vazio. Nenhum deploy manual ou aceite de patch executado.

Vercel: alteração exata no vercel.json mantém a branch CF-034 bloqueada e
adiciona main=false. A publicação atual continua como referência a preservar:
dpl_FkfL25jbyrt6FdD5Di5wqoLH9iHm, commit272001f. O efeito sobre a integração
será conferido depois dos pushes; ainda não declarar integração concluída.

O CI anterior do HEAD187a167, run40331734258, concluiu 13 contratos, 18 temporais
em três fusos, 620 componentes, 891 backend, um wrapper Java e seis jornadas
sem falhas/skips/retry. Expanded foi pulado por condição. Os dois artifacts
baixados passaram na inspeção; o JAR2674c8eead6db9527cbca6436d1b269666a6fe3ee4ebb72cc2b22229300bd09c
foi vinculado a 820 inputs e ao checkoutcc58cdb. [Prova](package-chain-40331734258.json).
Essa aprovação não é transferida para o novo candidato de configuração.

O verificador de pacote agora admite também refs/heads/main por argumento
explícito. Continua exigindo os dois pais exatos da integração e árvore idêntica
ao candidato da PR, além de todos os hashes e recibos. A integração pelo merge
da PR no GitHub preserva esse vínculo; nenhum squash/rebase ou force push.

A separação permite integrar sem publicar a aplicação. O custo é manter os
próximos commits da main sem autodeploy até nova decisão. Nenhuma variável,
secret, região, réplica, proteção, DDL_AUTO, healthcheck ou banco real alterado.
DDL_AUTO=update, ausência de healthcheck e backend offline continuam limites
da avaliação de produção; aceites CF-017/P01/P02 e matriz ampliada permanecem
separados. CF-034 integral **em_revisao**, aceite local DEC-CI-04 preservado.
