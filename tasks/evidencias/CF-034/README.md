# CF-034 — preparação e validação local de CI

Estado: **em_revisao**, entrega local pronta para revisão independente.
Executor: Codex desta sessão; revisão independente não realizada.
Data: 24/10/2026, America/Sao_Paulo; logs UTC podem ter data 25/10.
Nenhum aceite integral ou aprovação para uso nesta entrega.

## Decisão e bases

[DEC-CI-04](../../../docs/sdd/decisoes/004-liberacao-local-CF-034.md) formaliza a
autorização expressa da PROP-CF034-01/A: preparação, implementação e provas
**exclusivamente locais** de CI. Não aprova zoom nativo200%, não conclui CF010/015,
não amplia DEC-ONB-03, não libera adoção CF017/P01/P02, writers, deploy ou sucessoras.
Execução local equivalente de comandos não é execução efetiva do GitHub Actions.

Lote documental 0f787eb + 79ce089 + 272001f publicado e integrado por fast-forward.
Main e branch documental remotas conferidas em
`272001f7b4c39aebd18bdcd856109f9a0f6c1213`. [Procedimento e preservação](INTEGRACAO.md).
Branch de implementação `codex/cf034-ci-local`, sem upstream, criada dessa base.
Nenhum commit de implementação publicado, force push, branch excluída ou PR criado.

Candidato de código da rodada 11:
`a5ad7a64794abca1cc852b11cc1bf79a156dafde`. A documentação posterior não integra
os inputs de produto/CI do pacote; [comparação de fontes](package-trace.json)
confirmou 810 arquivos idênticos e nenhum diff relevante frente a esse commit.
O produto backend/src/main e frontend/src não recebeu alterações neste recorte.

## Matriz e implementação

[Matriz critério/entrega/verificação/evidência/remoto/outros gates](MATRIZ.md),
[seleção e limites](SELECAO-E-LIMITES.md), [comandos e versões](COMANDOS.md).

- Dois workflows antigos substituídos por [ci.yml](../../../.github/workflows/ci.yml):
  job required progressivo e expanded opt-in dependente dele; contents:read,
  cache apenas de dependências, diagnóstico always, pacote apenas em sucesso.
- [ci.mjs](../../../.github/scripts/ci.mjs) é compartilhado entre local e Actions;
  lint, tipos, testes, build, PostgreSQL, E2E e pacote têm saídas distintas.
  Relatórios novos, contagens positivas e zero falhas/erros/skips são obrigatórios.
  Não há skipTests, continue-on-error ou retry que aprove falha obrigatória.
- [prepare/source](../../../.github/scripts/source.mjs) exportam inputs isolados,
  registram a condição da árvore e recusam mudança de bytes/conjunto de fontes.
  POM liga explicitamente cf034.reportsDirectory aos relatórios Surefire.
- Descoberta Vitest inclui onboarding em src antes ausente. Fixtures de contexto
  e selectionchange0ms corrigidas sem retirar as assertions de calendário; mock
  de guard apenas no teste unitário de cron. Integrações financeiras continuam reais.
- PostgreSQL16 descartável, guard contra banco externo, schema por contexto e
  inicialização idempotente. Expectativas de migração atualizadas explicitamente
  até V16; exportação exige segundos da SPEC-002. Alterações de oracle requerem
  atenção do revisor, com justificativas em [falhas/harness](FALHAS-E-HARNESS.md).
- [Coletor](../../../.github/scripts/publish-evidence.mjs) exclui propriedades XML,
  auth state, perfis, .env e SQL bruto do upload. Seu comportamento local foi
  [exercitado numa falha](diagnosis-check.json); upload remoto não foi executado.

## Gates da execução positiva final

Runtime novo `../controle-financeiro-runtimes/CF-034/11/`; fonte exportada e
diretório evidence-01 próprios, sem reuso de aprovação das tentativas anteriores.
O nome curto evita a falha de spawn demonstrada no Windows para caminho264.

| Camada | Resultado real da rodada 11 |
|---|---|
| Instalação / lint / tipagem | Passaram; lint sem warnings |
| Testes temporais |18 em 3 fusos; passaram, sem falhas/skips |
| Componentes/onboarding |620 aprovados, sem falhas/skips |
| Compilação/build Next | Passou; browser instalado |
| Compilação backend |255 fontes main e 125 de teste compiladas com release 21 |
| Execução de testes backend / PostgreSQL |889 aprovados, 0 falhas/erros/skips, todas as 94 classes obrigatórias reportadas |
| Maven verify / empacotamento |Exit 0; JAR produzido após testes, sem skipTests |
| E2E Java e browser |Wrapper 1/1 e seis jornadas reais aprovadas; 0 skips/flaky, sem retry |
| Pacote elegível após todos os gates locais |JAR conferido e copiado, manifesto e SHA-256 próprios |
| GitHub Actions remoto deste candidato | **Não executado** |

[Resultado completo](runs/required-11/result.json),
[backend por suíte](runs/required-11/surefire-summary.json),
[componentes](runs/required-11/components-summary.json),
[jornadas](runs/required-11/browser-summary.json),
[ambiente/16 migrações](runs/required-11/browser-environment.json),
[inventário SHA das observações SQL](runs/required-11/browser-observations.json).
O wrapper inicia Spring real em porta aleatória, BFF Next na 3142 e PostgreSQL
descartável; apenas email e mercado externos são substituídos. SQL, recarga e
troca de sessão são assertions das jornadas, sem respostas financeiras prontas.

Quatro [testes do runner](ci-contract-tests.log) passaram, sem skips. Esses
controles não substituem testes financeiros, E2E ou semântica do runner remoto.
As contagens são por camada e não são somadas como cenários distintos.

## Falhas, contraprovas e restauração

[Histórico completo e limites](FALHAS-E-HARNESS.md). Tentativas02/03/05 falharam
em coleta, fixtures ou descoberta;06 foi exploratória e interrompida, sem verify
completo;07 reprovou backend889/22falhas/10erros;08 reprovou889/521erros de contexto;
10 passou backend889/889, mas os seis browsers não iniciaram. Nenhuma aprovou pacote.
[Coletas07](runs/failed-07/result.json), [08](runs/failed-08/result.json),
[10](runs/browser-start-failed-10/result.json). Logs e artefatos brutos preservados
nos runtimes externos; diagnóstico de browser usa o mesmo executável por caminhos
distintos, sem produto/zoom: [prova](browser-path-diagnostic.json).

Contraprovas em cópia09, candidato7ac7407, com scripts/helper idênticos aos de a5ad7a6:

- [Lint](runs/negative-lint/counterproof.json): erro any intencional, gate exit1;
  só install/lint executados, sem etapas seguintes ou pacote.
- [Regra temporal](runs/negative-date/counterproof.json): data local trocada por
  UTC, dois testes de hoje/prazo falham no primeiro fuso; gate exit1, sem etapas
  seguintes ou pacote. Nenhuma assertion foi alterada para aceitar a regressão.
- Ambos restauram date.ts ao SHA256
  `a21fdde714a3341e53a742faeaa1fe19a68b6461783bc15691e6b78eebf63661`,
  descriptor e conjunto de fontes originais. [Controle após restauração](runs/restored-control/control.json):
  lint e18 temporais aprovados. A falha esperada do gate não é confundida com o
  exit0 do experimento que confirma sua detecção.
- O diagnóstico anterior do cleanup de calendário reprovou ao remover o cleanup
  na cópia04 e restaurou o provider por SHA; não foi alteração no produto principal.
- [JAR adulterado](runs/negative-package/counterproof.json), candidato a5ad7a6:
  um byte alterado após verify, gate de pacote exit 1 com `Package changed`, sem
  artefato aprovado. SHA original restaurado; [controle após restauração](runs/restored-package/result.json)
  exit 0 e mesmo SHA do pacote positivo. Esse controle apenas copia o JAR já
  construído; não representa nova compilação ou reprodução binária demonstrada.

## Pacote e proveniência

Pacote local: `api-0.0.1.jar`, 86.226.092 bytes, da execução 11 completa.
SHA-256: `28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.
Source digest: `191e8beb19382553d50946a4b97b83825f878d4c13cff689ca6e49bbc6d6f787`.
[Manifesto da execução](runs/required-11/package-manifest.json),
[conferência de identidade](package-trace.json): commit a5ad7a6,
810 inputs por SHA, POM/lockfile, comandos/exits, gates, dependências frontend
efetivas e bibliotecas embutidas no JAR. Não associar o JAR da 10 aos resultados
da 11. O pacote é o JAR backend do verify; o build Next é verificado separadamente.
Não se promete imagem Docker, distribuição frontend publicada ou reprodução binária.
E2E usa Spring de testes com domínio/ORM reais, não uma implantação do JAR em uso.
O JAR permanece no runtime `CF-034/11/evidence-01/api-0.0.1.jar`, fora do Git e
sem publicação para consumo. README original modificado é registrado e excluído
dos inputs. Os relatórios novos são da mesma execução positiva desse pacote.

## Hashes históricos e preservação

[Análise dirigida](HISTORICO-HASHES.md), [67 comparações](historical-hashes.json):
todos os objetos versionados correspondem às bases d059bc9/e1a01b6/79ce089.
Em10 entradas, transformação registrada CRLF→LF reproduz o hash original; em57
(51XML/6TXT), a representação original não foi reconstruída e a causa histórica
não foi demonstrada. Não certificamos equivalência semântica de bytes indisponíveis
nem reescrevemos manifests históricos. Esses57 não são inputs do pacote novo;
resultados da nova execução são obrigatórios para sua própria proveniência.

Para esta entrega nova, o [índice de objetos Git](versioned-evidence.json) mantém
SHA dos bytes coletados e SHA/blob efetivamente staged: 94 arquivos conferidos,
85 idênticos em bytes e 9 reconstruídos exatamente por CRLF→LF, sem divergência
nova não explicada. `collectedSha256` nos manifests de coleta descreve os bytes
copiados no workspace; `blobSha256` identifica sua representação versionada.
O índice exclui a si próprio. Essa prova nova não explica retrospectivamente
as 57 representações antigas indisponíveis.

[Conferência final](preservation.json): 430 arquivos de runtimes históricos e
67 caminhos auditados sem mudança desde as observações de entrada.
README raiz permanece com SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Sem restauração automática, clean/reset destrutivo ou limpeza geral de target.
Runtimes novos ficam sob CF-034; JDK preexistente foi apenas lido.
[Recursos ao encerrar](resources-final.json): nenhum container em execução,
porta 3142 livre e nenhum processo identificado com caminho/argumentos CF-034.
Nenhum processo alheio foi encerrado.

[Commits locais e base](git-lineage.json): 9fda00f, 83e84e6, 7fdbaae, 8bc4c51,
7ac7407 e a5ad7a6, seguidos do commit documental de entrega informado no fechamento.
Staging explícito; README, runtimes e binários não integram esses commits.

## Revisão e pendências

[Encaminhamento independente e trade-offs](REVISAO.md). Permanecem sem aceite:
matriz ampliada, execução Actions/Linux, eventos/permissões/needs/uploads/checks
remotos, imagem Dockerfile histórica e pacote publicado para uso. A seleção
smoke precisa de revisão de cobertura; os15 harnesses históricos não são verdes.
Todos os checkboxes integrais da CF034 continuam pendentes de revisão/evidência.
CF010/015 continuam em_revisao por zoom nativo200% não validado; adoção real
CF017/P01/P02, produção e sucessoras conservam seus gates. DEC-ONB-03 intacta.
