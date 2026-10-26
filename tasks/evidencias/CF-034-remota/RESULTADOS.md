# Resultado da rodada remota — publicação parcial

Atualização de 26/10: após autorização explícita do usuário, a
[PR #1](https://github.com/kaiqueGeraldo/controle-financeiro/pull/1) foi criada,
base main272001f, head36391ee, checkout de teste59b07fd.
[CI40320025985](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40320025985)
passou contratos12/12, install, lint, tipos e18 testes temporais; falhou em
componentes, bloqueando build/backend/E2E/pacote. Diagnosis12648232881 baixado:
ZIP SHA256 `226c64991f16bab336818bb4274953b5036313a26ad9ec4f0aebacd032232f1d`,
6 arquivos,5 hashes conferidos, zero sentinelas; expira02/11/2026 às12:08:11Z.
O reporter exclusivamente JSON deixou o detalhe privado no runner. Correção
delimitada no comando do harness adiciona verbose ao log sanitizado e mantém JSON
privado, sem mudar testes, assertions, timeout, retries ou allowlist de publicação.
Nova execução é necessária para diagnóstico causal. Nenhum pacote novo aprovado.
O relato de PR pendente abaixo descreve o bloqueio anterior, agora superado.

CI40321049200/c679140 reproduziu exit1 de componentes. Saída verbose foi
recusada pela coleta compartilhada, portanto nenhum diagnóstico bruto foi
publicado. A mudança é substituída por projeção do JSON: somente contagens,
arquivos e nomes dos casos reprovados no result.json e console sanitizado;
mensagens de assertions/DOM ficam privadas. Novo contrato prova essa exclusão:
13/13 contratos locais, zero skips. Primeira execução local sob sandbox recusou
rename no TEMP do sistema; repetição em runtime externo isolado passou12/12
antes desta extensão; nenhuma alteração no sanitizador para contornar o ambiente.

Push c679140 também acionou probes40321040770: contracts aprovado, cancelamento
suportado após ready, próxima etapa pulada, cleanup/upload aprovados. Cleanup
12648849233 baixado com SHA256
`769cf03fd9001bb3244c505459b93ee253a77732d257847bba318a7663726d8b`,
2 arquivos/1 hash conferido e zero sentinelas; observação anterior ao descarte.

CI40321673862/0952062, checkout5aa2474: diagnóstico seguro funcionou. Componentes
620 executados,614 aprovados,6 falhas,0 erros/skips. Os seis casos estão em
temporal-forms e temporal-presentation, com fixtures fixadas em02:59Z que esperam
23:59 de São Paulo. Harness de componente anunciava São Paulo sem definir TZ
do processo em Linux/UTC. [Comparação dirigida](timezone-comparison.json), em
checkout novo0952062 no Windows/Node24: mesmos13 testes/mesmos hashes, UTC exit1
com6 falhas; São Paulo exit0 com13 aprovados. Causa classificada como ambiente do
harness. Correção passa TZ/CF_TEST_TIMEZONE só ao subprocesso de componentes e
registra esses overrides no comando; suíte temporal de3fusos, assertions, casos,
timeouts e retries preservados. Diagnosis12649661157 baixado/conferido,6 arquivos/
5 hashes, zero sentinelas, SHA256
`dc5a5c0e91f21bc8a326aa37f52badf5d78b8353224dc08d66b04b102f811522`.
Build/backend/E2E/pacote ainda bloqueados até execução corrigida; sem novo JAR.

CI40323062343/8878948, checkout9b5303f: frontend completo aprovado (620 componentes,
18 temporais, lint/tipos/build), backend889 casos com23 falhas/91 erros/0 skips.
Sem E2E/pacote. Diagnosis12650476395 baixado,9 arquivos/8 hashes/zero sentinelas,
SHA256 `6b63fab98bee9b05c7df84984e4cc8c603bdf3d744274f474024298df4149552`.
As fixtures OnboardingMigrationTest e OnboardingV16MigrationTest faziam SET
search_path por SQL em conexões Hikari: o próximo consumidor recebia schema de
upgrade, diferente do Hibernate. Correção de quatro operações para Connection.setSchema,
que o pool rastreia/restaura, sem alterar assertions de migração ou produto.
[Prova dirigida](pool-schema-comparison.json): mesmos2 casos de regressão, versão
SQL2 falhas/0 erros; versão corrigida2 aprovados, zero skips. Teste observa as duas
conexões do pool e integridade usuário/conta, sem depender de ordenação. Primeiro
ensaio com pool1 falhou na inicialização Flyway e não conta como contraprova.
Seleção passa de94 para95 classes e acrescenta2 casos; suíte remota completa
ainda necessária. Cache global, timeouts, retries e classes anteriores preservados.

Vercel26/10: titular concluiu a verificação adicional; BACKEND_API_URL confirmado
como HTTPS/raiz para o hostname do serviço backend Railway, sem credenciais ou
query na URL, ocultado novamente. All Environments permanece; nenhuma alteração
de configuração, requisição à aplicação ou acesso a banco real.

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
