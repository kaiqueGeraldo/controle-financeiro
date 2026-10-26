# Resultado da rodada remota — publicação parcial

Branch publicada emef76aee, corrigida em `5593e4e8269070d5e0269ef26c8451c0bb910c55`.
Main permanece272001f, sem integração. [Registro estruturado](remote-results.json).

| Execução | Resultado efetivo |
|---|---|
| [40246339786](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40246339786),ef76aee | 12 contratos e experimentos passaram; upload recusou `..`; cancellation pulado. Falha de workflow preservada; nenhum pacote. |
| [40246575186](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40246575186),5593e4e | Contracts aprovado,12/12 sem skips. Workflow cancelado intencionalmente após prontidão; etapa posterior pulada; cleanup e upload concluídos. Não é workflow de produto aprovado. |

Runner Ubuntu24.04.5/image20261012.334.1, Node24.21.0/npm11.19.0;
token efetivo Contents:read/Metadata:read. Aviso de migração do ubuntu-latest para26
não altera o sistema observado. PostgreSQL16-alpine usou digest
`f4610795587492cd4fb887c2dc3de301b813278bb6f616992061141b5f15ac36`,
network none, sem portas publicadas e dados em tmpfs.

## Artifacts e contraprovas

Três artifacts baixados/inspecionados: contracts12619036288, ready12618957668 e
cleanup12618379689. SHA256 de cada ZIP igual ao digest da plataforma. Contracts:
5 arquivos/3 hashes de manifesto conferidos; ready:1 recibo; cleanup:2 arquivos/
1 hash conferido. Zero sentinelas sensíveis no download; senha JSON, Bearer opaco,
cookie e JSON escapado removidos. Aspa incompleta bloqueou coleta/publicação sem
fallback. [Inspeção do ZIP contracts](artifact-contracts-40246575186.json).

Exit23 do subprocesso sintético fez o gate real encerrar1 e bloquear backend/E2E/
pacote. Prova de relatório ausente usa o validador real, não uma suíte Maven;
adulteração usa bytes sintéticos recusados pelo gate de pacote e restaurados por
SHA256, não JAR histórico nem pacote de aplicação. Não generalizar essas provas.

[Ready baixado](artifact-ready-40246575186.json) registra filho/descendente vivos
e PG pronto. [Cleanup baixado](artifact-cleanup-40246575186.json) registra ambos
ausentes, runner cancelled, container próprio removido e ausência de avanço/
pacote. Observação **anterior** ao descarte da VM; sem inspeção de processos após
o descarte. [Comprovante](cancelamento-remoto.png). Retenção7dias, expiração dos
artifacts01/11/2026,20h51–20h52 (São Paulo); resumos/hashes duráveis no Git.

Logs Actions completos foram preservados em `CF-034/rem-download-01/logs` e na
plataforma. O sanitizador compartilhado recusou sua estrutura de apresentação;
somente hashes/motivos `logs/*.withheld.json` foram versionados. Sem fallback
bruto e sem mudar o sanitizador aceito para acomodar o renderer Actions. Esse
canal é distinto dos artifacts sanitizados cujo upload/download foi comprovado.

## Bloqueios e limites atuais

**PR não enviada:** conector GitHub retornou403. A revisão automática de
aprovação rejeitou o envio pelo navegador por considerar ausente aprovação
confiável para o texto específico e seus efeitos externos. [Proposta exata](PR-PROPOSTA.md)
preparada e confirmação solicitada; sem ampliar permissões ou envio indireto.

**Gates reais de produto não executados nesta rodada:** lint/tipagem/datas/
componentes, Maven/PostgreSQL de domínio, E2E, build e novo JAR permanecem
pendentes. CI novo não está na default branch para dispatch. Não mudar evento
para contornar a recusa da PR nem integrar main só para habilitar CI.
Nenhum novo pacote de aplicação/SHA256 é apresentado; JAR histórico continua
a5ad7a6. CF034 integral **em_revisao**, aceite local preservado.

Verificação após pushes: Railway API/PG offline, sem operação pendente/novo
deploy; Vercel lista como produção mais recente a mesma
FkfL25jbyrt6FdD5Di5wqoLH9iHm/272001f de24/10, sem deployment CF034 observado.
Decisão de desativar gatilhos de produção da main continua necessária antes de
integrar. Valores protegidos por verificação adicional, banco real, zoom200%,
Ctrl+C Windows, adoção CF017/P01/P02, matriz ampliada e produção não certificados.

Commits seguintes somente documentam estes resultados. Não atribuir aprovação
automática a outro SHA; conferir candidato e gates antes de qualquer integração.
