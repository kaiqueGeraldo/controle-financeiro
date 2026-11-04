# Resultado — Expanded local do recorte autorizado pela DEC-ZOOM-05

03/11/2026, horários privados também em UTC de04/11. **A única rodada completa
Linux passou626/626 em71 arquivos. A continuidade expanded reprovou no backend;
não houve E2E financeiro nem pacote.** Nenhuma correção funcional foi aplicada
e a causa dos dois timeouts Linux históricos continua inconclusiva.

## Componentes Linux

Uma invocação real, sem filtros/retries:626 coletados,626 iniciados/finalizados,
626 IDs Vitest únicos,71 arquivos com início/fim, exit0, zero falhas, erros globais,
skips, pendências e workers perdidos. O multiconjunto arquivo+título coincide com
o inventário esperado; há625 chaves distintas por uma colisão histórica de título.
SHA da seleção7debb7e4dbafd0452bc20cfefd2f0767f246f55bb3d63fc2fb8724f8a722038f.

| Teste histórico | Resultado atual | Duração Vitest |
|---|---|---:|
| CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável |aprovado |2652,056ms |
| compares conflict snapshots and does not silently choose the server |aprovado |1440,208ms |

Arquivos, marcos, distribuição, custo e limites em [CONDICOES](CONDICOES.md);
dados verificáveis em [RODADA](RODADA.json). Watchdog5000ms, fixture80,
assertions, awaits, relógios reais, poolforks e decisão automática de concorrência
preservados. Pico amostrado16 workers; sem throttling/OOM/pressão de memória.
Não houve Profiler/interceptação global de render/query ou logging por operação.
O custo medido não inclui todo IPC/reporting; não se afirma overhead zero.

A preparação01 parou antes de componentes:43 contratos passaram, mas o parser
de observação esperava TAP e recebeu spec do Node24. Preparação02 explicitou
TAP e validou o observador em três casos sintéticos (um erro intencional).
Isso não é segunda execução dos626. Brutos e versões dos scripts preservados.

## Gates posteriores e tentativas operacionais

| Etapa | Resultado |
|---|---|
| Linux: contratos, install, lint, tipos, temporais |43 contratos e18 execuções temporais aprovados; comandos exit0 |
| Linux: build e browser-install |aprovados, após restauração dos dois overlays por hash |
| Preflight Windows |C–G aprovados; JVM Windows → Docker Desktop →127.0.0.1, Ryuk, guard, JDBC e cleanup |
| Contratos Windows |43 aprovados; não somados aos mesmos43 Linux |
| Frontend Windows inicial |install/lint/tipos/18 temporais e626/71 componentes aprovados, com auditoria canônica |
| Build Windows inicial |reprovou por caminho físico de272 caracteres; tentativa integral preservada |
| Frontend no runtime físico curto |nova instalação/lint/tipos/18 temporais/build/browser aprovados; componentes Windows atuais revalidados e reaproveitados, sem repetir626 |
| Primeira invocação backend |CMD recusou linha longa com116 classes, antes de Maven/testes; preparação preservada |
| Backend por Java @argfile |uma execução real completa:116 classes/116 XML;928 testes,913 aprovados,15 falhas,0 erros,0 skips; Maven exit1 |
| Contrato Windows pertinente |AdoptionNativeSocketsTest1/1 aprovado, incluído uma vez nas116 |
| RF15 obrigatório |A25=B2+C23 conferido;23 resultados reprovados por lançamento de browser,0 aprovados/skips/retries/flaky; processo exit1 |
| E2E financeiro CF032 |não alcançado; bloqueado pelo backend |
| Pacote/proveniência de JAR |não produzido; nenhum JAR antigo apresentado como atual |

A continuidade é **composta com reaproveitamento explícito de gates atuais**,
não uma nova execução integral Windows. Não há transferência de markers Linux
para Windows. O frontend reaproveitado tem fonte d7 idêntica, mesma plataforma/
Node e relatórios revalidados pelo auditor canônico. Adapters externos ao
candidato conservaram backend, cobertura, RF15, E2E e package canônicos;
o último mantém essas fases no mesmo runId. Ver [RETOMADA](RETOMADA.md) e os
planos/hashes privados. Não há reaproveitamento de resultados históricos anteriores
a este lote, nem soma das mesmas626 identidades entre plataformas.

## Falhas e classificação

Todos os116 XML esperados existem, sem classes ausentes ou extras:
115 comuns +1 contrato Windows. As15 falhas são em15 wrappers de navegador,
não928 falhas nem problema inicial de guard/PostgreSQL. Os relatórios completos,
nomes dos casos e hashes constam de [CONTINUIDADE](CONTINUIDADE.json).

- **14 wrappers: lançamento ENOENT**, correlacionado aos seus playwright.log.
  Incluem os históricos CF014/CF019, fechamento frontend, milestones, famílias
  RF15/RV24/RVR24 e hábitos. Em RF15C, as23 identidades exigidas e a proveniência
  estão corretas, mas os23 resultados falharam com ENOENT; o verificador rejeitou.
- **UserIsolationBrowserIntegrationTest:** Next na cópia preparada registrou
  Turbopack/path length. A readiness de120s terminou em ready=false,
  browser.cjs:25; a assertion do wrapper é efeito posterior. O browser não
  chegou à jornada de login/logout. Não é o watchdog Linux de5000ms.
- **Prova discriminante:** o headless-shell instalado existe no caminho274,
  SHA addfa79abb060e1e514e155ed745d4bf96140bca402735958bb4e223aea0b98c.
  spawn --version retorna ENOENT nesse caminho e exit0/versão153.0.8010.12 no
  caminho físico172, com os mesmos bytes (292 hardlinks conferidos).
  É diagnóstico de lançamento, sem aprovação de jornada ou repetição do backend.

O problema operacional de comprimento está sustentado para esses lançamentos.
Isso não garante que futuras jornadas aprovarão suas assertions quando o browser
iniciar. A causa histórica dos componentes Linux continua inconclusiva e distinta.

## Coerência dos inputs e limites para pacote

Candidato de inputs: d53de50fa6e005795286f492aa8cb8d5f4b53380;860 arquivos
idênticos ao produto/testes/CI0aac7ccd, digest
d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Observação Linux alterou somente dois arquivos na cópia nativa, com inverso textual
conferido e hashes registrados; digest observado89d00624… não é o digest original.
Os860 bytes foram restaurados antes do build; não houve delta de produto na worktree.

No candidato Windows, os860 originais continuam iguais, mas24 arquivos gerados
em frontend/tests/artifacts passaram a integrar o conjunto percorrido pelo guard.
sourceFor rejeita corretamente “Source file set changed after the recorded snapshot”.
Isso é um bloqueio adicional de coerência, não uma fonte nova silenciosamente
aceita. Arquivos, traces e manifest originais preservados; não houve limpeza,
resnapshot ou bypass. A consolidação lê o manifest original e registra essa
divergência expressamente; não libera marker backend/E2E/package.

## Preservação, coleta e cleanup

Runtimes novos: componentes-completo-20261103-01 e componentes-completo-w,
sob controle-financeiro-runtimes/preparacao-adocao. Brutos privados incluem
stdout/stderr, JSON/audit/eventos, recursos, XML, RF15 e traces. [COLETA](COLETA.json)
registra a allowlist sanitizada local dos controllers; não houve upload/publicação.

O primeiro arquivamento tentou copiar um symlink Linux e falhou por privilégio
Windows. O ajuste copiou apenas os oito scripts executados, conferindo seus
hashes; arquivo parcial e erro preservados. O executor próprio foi removido
por ID/label após coleta e confirmação do digest nativo restaurado.
Testcontainers/Ryuk terminaram; Docker voltou aos8 containers históricos,
3 redes e0 volumes, sem containers ativos. Os21 PIDs de backend/adoção conferidos
já não existiam. Nenhum processo alheio foi encerrado.

[PRESERVACAO](PRESERVACAO.json) registra2340 referências verificadas, incluindo
1113 protegidas, originais11, pacotes, falhas, provas independentes e diagnóstico.
READMEs intactos: principal6235da8e…; worktree e7d3458f….
As únicas alterações preexistentes previstas neste lote são as notas CF034/CF036,
com originais arquivados. Fonte/CI/migrations/decisão mantidas. CF034 permanece
em_revisao, CF036proposta; checkboxes de aceite não foram marcados.

## Próximo passo e estado de revisão

[Próximo passo](PROXIMO-PASSO.md): localizar binários de browser e frontends
preparados em caminhos físicos curtos, padronizar os overrides hoje fixados em0,
redirecionar artefatos para fora das fontes e provar o lançamento/startup antes de
outro lote backend. Sem alterar watchdog, fixture ou assertions. O backend real
reprovado não foi repetido para buscar verde.

Branch codex/saneamento-pr3-expanded; base03028231. Observação d53de50f,
preparo4f4c9169, caminho28e741cd e Maven baff0e49; commits finais de provas/notas
são posteriores. O HEAD final e intervalo completo ficam em git-final.json privado
e na entrega. Revisão conjunta pendente, sem autoaceite integral.

Sem push, PR, CI remota, merge, intervenção manual de zoom, hospedagem,
deploy ou banco real. Zoom nativo continua pendente sob a exceção exata DEC-ZOOM-05.
