# Matriz — Expanded local do recorte autorizado pela DEC-ZOOM-05

Lote autorizado em 03/11/2026, America/Sao_Paulo. Base inicial
9d3c384a5b36085a1c82014302b1c4191ba3b8e1; scripts operacionais serão commitados
antes da suíte. Produto/testes/CI: 860 inputs de 0aac7ccd, digest
d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
O candidato dos gates será o HEAD do commit operacional, sem mudanças nesses
860 bytes. O manifest e flow.json registram commit/digest/scripts efetivos.

Runtime externo: expanded-local-20261103-02. Controles do preparador permanecem
em subdiretórios próprios; a exportação da suíte usa expanded-local-s/candidate.
Resultados nunca são sobrescritos. O prévio expanded-local-20261103-01 permanece
inalterado; sua recusa de prefixo é evidência anterior, não execução desta rodada.

| Gate | Comando | Plataforma | Inputs/seleção | Relatório obrigatório | Aceite |
|---|---|---|---|---|---|
| Preparador | node --test preparador.test.mjs | Node Windows | nomes, raiz, traversal, junctions, existente, CLI real e export | preparador-tests.log e manifest dirigido | 8 controles, zero falhas/skips, 860 fontes conferidas |
| Preparo da suíte | node preparar-proxima.mjs <runtime>/expanded-local-s | Windows | HEAD operacional e mesmos 860 inputs | prepare.log; candidate/.ci-source.json; flow.json | exportação nova, nenhuma fonte antiga silenciosa |
| Preflight | node preflight-windows.mjs <runtime> <JDK21> 01 | JVM Windows → Docker Desktop Linux → 127.0.0.1 | InfraProbe e guard originais, PG16/Ryuk novos | preflight-01/{baseline,inputs,execution,cleanup}.json e windows.log | daemon aprovado, etapas C/D/E/F/G, JDBC sintético, cleanup por ID/labels |
| Contratos Windows | node --test .github/scripts/{ci,suites,sanitize,required,zoom-coverage,paths,components}.test.mjs | Node Windows | candidato exportado | contracts-windows.log; exit/início/fim em flow.json | todos passam; seleção/relatórios/falhas preservados |
| Frontend Linux | node frontend-linux.mjs <candidate> <runtime>/linux-native | controlador Docker Windows; Node Linux nativo | os 860 arquivos copiados/verificados byte a byte em /work/s; sem bind de fontes/dependências como execução | native-inputs.json, contracts.log, frontend/result.json, components/audit/eventos, logs, BUILD_ID, native-after.digest | contratos, install, lint zero warnings, tipos, temporais 3 fusos, 626/71 por identidade, build/browser-install sem falhas/skips; digest final igual |
| Frontend Windows | ci.mjs all: npm ci; lint --max-warnings=0; typecheck; npm test; test:component com audit; build; test:e2e:install | Node Windows; TZ componentes São Paulo | mesmo candidato/lock; sem reaproveitar markers Linux | windows-expanded/result.json; logs e componentes JSON/audit/eventos | gate completo atual e marker frontend; zero falhas/erros/skips |
| Backend expanded | ci.mjs all: Maven verify, JVM UTC, cache.maxSize=4, failIfNoTests, seleção FQCN, reportsDirectory e browser.evidence explícitos | JVM Windows/JDK21; PG16 Linux em Docker Desktop, host JVM loopback | 116 identidades = comuns115 + AdoptionNativeSocketsTest1 | backend-selection.json; backend.log; todos os XML; marker backend; hashes de JAR | cada classe/caso presente, zero falhas/erros/skips; erros causais distintos dos derivados |
| Contrato Windows | incluído no mesmo verify de 116; sem execução duplicada | JVM Windows | com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest | XML correspondente atual | executado sem skip; não somar como classe adicional |
| RF15 | Rf15RemediationBrowserTest → zoom-browser.mjs → Playwright rf15 config | JVM/Node/Chromium Windows; PG Linux | A25=B2+C23; somente dois casos DEC-ZOOM-05 adiados | universe/manifest/selection/invocation/results/verified/process atuais, logs, traces/capturas/SQL pertinentes | C23 exato, zero skips/retries/flaky; candidato/digest/runId corretos; controles nos mesmos arquivos mantidos |
| E2E financeiro | ci.mjs all: Maven -Dtest=FinancialJourneyPostgresE2E test com CF032_GREP vazio | JVM/Node/Chromium Windows; PG Linux | 13 jornadas expanded, fixtures sintéticas e BFF/Spring/DB reais | e2e-surefire; browser/playwright.json/log, SQL/recibos/terminal-sql | markers atuais; zero falhas/erros/skips/flaky e persistência/reload; Next start 3142 do build atual |
| Pacote/proveniência | packageArtifact do all | produtor Windows | exatamente o JAR do verify, após frontend/backend/E2E | package-manifest.json; SHA256; result.json e comandos/toolchain | todos markers atuais e hash do JAR verificado; sem pacote antigo ou skipTests contado como teste |
| Coleta/cleanup | coletor canônico em outputs existentes; snapshots e recursos próprios por ID/session/labels | Windows/Docker Desktop | originais privados e manifests por referência | referências/hashes sanitizados e comparação Docker/processos/preservação final | nenhum recurso próprio restante, READMEs/referências originais intactos; sem limpeza global |

## Sequência, contagens e limites

execução: preparo → preflight → contratos Windows → frontend Linux → all Windows
(frontend → backend com RF15/contrato Windows → E2E → package). A falha bloqueia
dependentes. Ajuste operacional autorizado pode gerar tentativa nova identificada,
com primeira ocorrência preservada e reexecução dos gates afetados/dependentes.
Falha funcional ou inconclusiva para o fluxo, sem retries ou aumento de timeout.

Frontend Linux e frontend Windows usam fontes idênticas, instalações novas e
relatórios independentes. Não se transferem markers entre plataformas. Seus
626 componentes são as mesmas identidades; não se somam como 1.252 testes distintos.
Temporais repetidos em três fusos e contratos repetidos em duas plataformas também
não viram identidades novas. A cobertura Java é uma união, não 116+1 ou 115+116.
RF15 é Playwright dentro de um wrapper Java, não 23 classes adicionais.

RF15 conserva Next dev 3107 pelo config original; CF032 conserva Next start 3142.
Sem substituição silenciosa de modo. Backend Linux/Actions, zoom integral, CI remota,
CF017/P01/P02, adoção e produção não recebem certificação por esta execução.

## Correção operacional

A proposta de uma linha foi confrontada com o requisito adicional de caminhos:
aceitar só o novo prefixo sem proteger parents com junction não seria suficiente.
O preparador agora reutiliza physicalPath e requireNewRuntime: raiz lexical e
física, path absoluto, rejeição de traversal, parent não diretório, junction/link,
nome fora das duas convenções e destino existente. O custo é linear no número
de segmentos e no tamanho do caminho, com leituras de metadados; não modifica
produto, SQL, concorrência ou assertions financeiras.

A orquestração grava os scripts efetivos por hash, usa o probe original somente
no Windows e acrescenta frontend Linux nativo independente. Não altera allowlist,
guard, isolamento, autenticação, required, seleção, retries ou timeouts.

## Tentativa operacional 02

A tentativa 01 (commit 1e1f23cd) exportou os 860 inputs e passou C–G do preflight,
mas o snapshot de cleanup encontrou Ryuk transitório sem a label de session.
A consulta posterior confirmou sua remoção automática. Primeira falha preservada
em flow.json/preflight-01. Não houve suíte de produto nessa tentativa.

O observador agora correlaciona o ID exato registrado na criação de Ryuk pela JVM,
a imagem e a label Testcontainers, sempre recusando IDs do baseline. Quatro controles
positivos/negativos passaram; não houve alteração do probe, guard, timeout ou Ryuk.
A tentativa 02 usa nomes novos (flow-02.json, preflight-02, expanded-local-s-02,
linux-native-02 e windows-expanded-02), repete o preflight afetado e só então segue.
Nenhum resultado de produto é herdado da tentativa 01, que não os produziu.
