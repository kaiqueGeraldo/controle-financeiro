# Preservação, proveniência e encaminhamento

## Inventário e candidato

[inventory.json](inventory.json) confronta o inventário anterior de 3.165 caminhos.
3.161 iguais, nenhum ausente e exatamente quatro alterações:

1. `.github/scripts/ci.mjs` — runner, brutos e cancelamento.
2. `.github/scripts/publish-evidence.mjs` — sanitização e publicação atômica.
3. `.github/workflows/ci.yml` — testes e gates de coleta/upload.
4. `tasks/evidencias/CF-034/collect.mjs` — política compartilhada e destino atômico.

São arquivos de implementação/coleta no delta autorizado, não provas originais
ou manifests históricos reescritos. Código anterior recuperável em 8d58207.
Os arquivos novos (sanitizador, adaptadores etc.) não estavam naquele inventário;
as alterações de tasks/README e canônico também são delimitadas pelo diff, não
contadas como parte dos 3.165. Não descrever o inventário inteiro como intacto.

Os três scripts originais independentes conferem com baseline-inputs por SHA:
review.mjs: 8f5050ec…, cancellation.mjs: e9a8287d… e supplement.mjs: 0cfdde20… .
Não há diff em revisao-CF-034 entre 8d58207 e 91ee02d. Provas originais de sentinelas
e heartbeat permanecem. Cópias relocadas e novas assertions desta execução têm
nomes/destinos distintos; erros próprios foram preservados com justificativa.

[preservation-before.json](preservation-before.json) amplia o inventário de
entrada atual com scripts/evidências versionados e outputs antigos de runtimes,
sem atravessar node_modules/targets/checkouts/junctions. [preservation-final.json](preservation-final.json)
confere esses bytes atuais ao final. É um conjunto explícito, não todo byte de
todos os discos. README raiz continua modificado e fora do índice, SHA inicial/
final histórico 6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca.

## Pacote e coleta nova

Nenhum pacote novo produzido. JAR histórico da rodada11 permanece atribuído a
`a5ad7a64794abca1cc852b11cc1bf79a156dafde`, SHA
`28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.
Fonte/descriptor originais 810 inputs foram relidos por sourceFor no runtime11,
sem comparar os scripts atuais modificados como se fossem inputs desse pacote.
Os scripts de saneamento e desta revisão não compilaram nem validaram de novo
os testes financeiros desse JAR. Provas são do runner/coletor/processos sintéticos.

[provenance.json](provenance.json) prova a fronteira alterada do manifesto:
uma cópia do package-manifest histórico passa pelo coletor novo, conserva a
mesma estrutura/valores e distingue rawLocalSha256/sanitizedSha256. Original
permanece byte a byte; hash do JAR foi recalculado. Sem result nessa coleção,
collection marca incomplete/no approval, apesar de conter um manifesto histórico.
Isso não autoriza usar status do coletor como teste novo ou aprovação do pacote.

Os manifestos antigos não foram reescritos. As 57 representações brutas históricas
não reconstruídas permanecem fora da sustentação do pacote da11; a distinção
entre conteúdo Git, transformação comprovada e identidade de bytes é mantida.
Não se solicitou reconstrução de toda a história para decidir esse delta.
Rastreabilidade não é reprodução binária, imagem ou liberação de uso.

## Próximo passo delimitado

Primeiro sanear RCI034-01/R1 em execução separada, preservando inputs/contrato
vermelho, e revalidar somente fronteiras afetadas. Preservar aceite dos controles
originais e Windows/processos. Quando se reivindicar encerramento completo de
recursos, comprovar o procedimento de descarte de recursos externos descartáveis
após cancelamento, sem banco real nem limpeza global. Não se inicia essa etapa aqui.

Não há aprovação para publicar agora. O encaminhamento remoto anterior permanece
condicionado ao aceite local e à autorização específica. Seu escopo técnico:

| Item | Etapa futura, não executada |
|---|---|
| Workflow/eventos | ci.yml: push main, pull_request para main com filtros backend/frontend/.github/tasks/docs/sdd; workflow_dispatch |
| Jobs/matriz | required smoke; expanded somente por dispatch suite expanded e needs required, com preparação própria dos 15 harnesses históricos |
| Permissões/secrets | contents:read, checkout sem persistir credenciais; nenhum secret de aplicação/produção declarado; conferir permissões efetivas de cache/artifacts e checks externos |
| Artifacts/retenção | diagnosis-SHA e expanded-diagnosis-SHA via public/ após collect success; tested-package-SHA com JAR e public/package-manifest, 7 dias |
| Cancelamento remoto | Adaptador POSIX/grupos, SIGINT/SIGTERM, timeout e cleanup Actions/Linux ainda sem execução; não certificados pelo Job Windows |
| Efeitos externos | Downloads npm/Maven/browser/imagem, cache, artifacts/logs/checks/notificações GitHub e uso do runner; sem deploy definido neste YAML |
| Critérios que poderá fechar | Comandos e serviços Linux reais, eventos/needs/if e bloqueio causal, uploads/identidade do pacote remoto, cancelamento e checks configurados |
| Continuam próprios | Matriz ampliada se não exercitada, imagem Dockerfile, CF015/zoom200%, adoção CF017/P01/P02, backup/migração/produção, uso e sucessoras |

Nenhum evento remoto foi acionado; nenhuma permissão ampliada. CF034 integral
continua em_revisao, CF010/015 também; DEC-ONB-03 e decisões anteriores não mudam.
