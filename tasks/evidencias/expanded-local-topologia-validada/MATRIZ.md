# Matriz prévia — Expanded local do recorte autorizado pela DEC-ZOOM-05

Registrada antes da tentativa de preparo de 03/11/2026 (America/Sao_Paulo).
Candidato previsto: f6297df873b5120d610f0b951f706c8981351cfb,
branch codex/saneamento-pr3-expanded. Inputs: 0aac7ccd25934ec022939464486da9fb28610279,
860 arquivos, digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Não transferir resultados anteriores. Parar na primeira recusa; sem retries ou correções nesta rodada.

Runtime novo solicitado: ../../controle-financeiro-runtimes/preparacao-adocao/expanded-local-20261103-01.
Convenções abaixo: C=candidate; O=windows-expanded; F=C/controle-financeiro-frontend;
B=C/controle-financeiro-backend. Todos externos à árvore de fontes.

| Gate | Comando previsto | Plataforma | Inputs/seleção | Relatório obrigatório | Condição de aprovação |
|---|---|---|---|---|---|
| P0 identidade/preservação | git status, branch, HEAD, merge-base, diff e hashes | Windows | dois checkouts, revisões 2c6bb04a/f6297df8, acervos | preservação inicial/final e proveniência | base exata; nenhuma alteração alheia |
| P1 preparo | powershell.exe -NoProfile -NonInteractive -File tasks/evidencias/revisao-expanded-plataformas-docker/proxima-rodada.ps1 -Runtime <runtime novo acima> -Java21 <JDK aprovado> | controlador Windows | preparador revisado, 860 fontes, manifest anterior somente como oráculo de inputs | comando/exit/início/fim; C/.ci-source.json | runtime novo, daemon aprovado, export idêntico ao digest |
| P2 preflight dinâmico | InfraProbe.java revisado, JVM Windows, host 127.0.0.1; mesma infraestrutura e guard | JVM Windows → Docker Desktop/Linux | recursos novos próprios; Ryuk ativo; PostgreSQL16 cf_test_ | etapas C–G, IDs/session/labels, JDBC, cleanup | loopback literal, guard/negativos intactos, consulta sintética, cleanup comprovado |
| G1 contratos CI/seleção | node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs .github/scripts/zoom-coverage.test.mjs .github/scripts/paths.test.mjs .github/scripts/components.test.mjs | Node Windows | fontes congeladas; fixtures isoladas | TAP atual, comando/exit | zero falhas/skips; rejeição de omissões/relatórios inválidos |
| G2 instalação | npm ci --no-audit --no-fund (em F) | Windows | package-lock do manifest | O/install.log, result.steps | exit 0, instalação nova |
| G3 lint/tipagem | npm run lint -- --max-warnings=0; npm run typecheck | Windows | mesmas fontes/dependências | O/lint.log, typecheck.log, result.steps | ambos exit 0, zero warnings |
| G4 temporais/unitários | npm test | Node Windows, três fusos | scripts/test.mjs; São Paulo/UTC/Kiritimati | O/unit.log, result.unit | três conjuntos não vazios, zero falhas/skips/todo/cancelamentos; não somar como identidades distintas os mesmos testes em fusos diferentes |
| G5 componentes | npm run test:component -- --reporter=default --reporter=json --reporter=./tests/component/audit-reporter.mjs --outputFile=<O/components.json> | Windows, TZ São Paulo | 626 identidades/71 arquivos, contexto candidato/digest/runId | components.json, component-audit.json/eventos, components.log | conjuntos exatos, zero falhas/erros/skips; exit 0 |
| G6 build/browser | npm run build; npm run test:e2e:install | Windows | fontes atuais e lock | build.log, browser-install.log, marker frontend atual | build e instalação exit 0; não trocar modo dos servidores históricos |
| G7 backend expanded | Maven wrapper via ci.mjs all: -Duser.timezone=UTC -Dspring.test.context.cache.maxSize=4 -DfailIfNoTests=true -Dsurefire.failIfNoSpecifiedTests=true -Dtest=<116 FQCN> -Dcf034.reportsDirectory=<O/surefire> -Dcf.browser.evidence=<O/browsers> verify | JVM Windows JDK21; PG16 Linux em Docker Desktop | 115 comuns + 1 exclusivo Windows; seleção expanded | backend-selection.json, maven-version.log, backend.log, XML por classe/caso, result.backend | todas 116 classes atuais, zero falhas/erros/skips; não confundir cascata de contexto com defeito financeiro |
| G8 contrato Windows | incluído em G7, AdoptionNativeSocketsTest; não executar windows-native novamente para somar | JVM Windows | única identidade exclusiva Windows | seu XML atual dentro de O/surefire | cobertura de união 116; sem dupla contagem |
| G9 RF15 | Rf15RemediationBrowserTest → .github/scripts/zoom-browser.mjs test --config tests/e2e/playwright.rf15.config.ts | JVM Windows, Node/navegador Windows; PG Linux | A25 = B2 + C23; somente identidades DEC-ZOOM-05 em B | universe, manifest, selection, invocation, results, verified, process; traces/capturas/SQL pertinentes | C23 exato, zero falhas/erros/skips/retries/flaky, correlação candidato/digest/runId; controles nos mesmos arquivos obrigatórios |
| G10 E2E financeiro | ci.mjs e2e interno ao all: Maven -Dtest=FinancialJourneyPostgresE2E ... test | JVM/Node/navegador Windows; PG Linux | suíte expandida completa, CF032_GREP vazio | e2e-surefire, browser/playwright.json/log, SQL/recibos/reload/terminal-sql | markers frontend/backend atuais; Java e Playwright sem falhas/skips/flaky; persistência real |
| G11 pacote/proveniência | packageArtifact interno ao ci.mjs all; cópia do único JAR produzido pelo verify | produtor Windows | markers frontend/backend/e2e atuais, mesmo JAR verificado | package-manifest.json, SHA256, result.json, fontes/comandos/toolchain | gates anteriores aprovados, hash igual ao verificado; não alegar execução de testes por skipTests |
| G12 coleta/cleanup | coletor publish-evidence.mjs nos resultados existentes; snapshots Docker e processos próprios | Windows/Docker Desktop | somente IDs/sessions/labels criados nesta execução | originais privados + hashes/representações sanitizadas; cleanup/preservação | nenhuma remoção global; comprovar ausência de recursos próprios e integridade dos alheios |

## Comando canônico e limites

O comando preparado chama node C/.github/scripts/ci.mjs all C O e executa
frontend → backend (incluindo contrato Windows e RF15) → E2E → package.
G1 é o gate de contratos adicional do workflow/plano; não está embutido no all.
Antes de uma execução real, ele deve passar após preparo/preflight e antes do all.
A sequência para no preparo se o caminho autorizado for recusado.

A tentativa usa frontend Windows porque o comando aprovado executa all no Windows.
Frontend Linux 626/626 em 71 arquivos continua evidência anterior, expressamente
identificada, e não resultado novo. Não há plano de duplicar Linux nesta tentativa
nem certificação do backend Linux/Actions. Os wrappers mantêm seus próprios modos
Next dev/produção; a matriz não autoriza substituí-los.

Somente P0 e verificações somente leitura de daemon/toolchain precedem P1.
Por haver incompatibilidade estática no preparador, P2 não criará recursos antes
de P1. Falha de P1 impede G1–G11. Não transformar diagnóstico em gate aprovado.
CF010/CF015, CF017/P01/P02, adoção real e produção conservam seus estados e gates.
