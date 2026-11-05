# Matriz de diagnóstico dos navegadores da expanded

Base de revisão: 82090a0810733f0f56ad24bed03416fe357dd351. Seleção extraída de suites.mjs, ci.mjs e dos ProcessBuilder Java; lista executável em .github/scripts/browser-wrappers.mjs. São 15 classes no backend expanded e um executor financeiro posterior. TemporalBrowserApiPostgresE2E e OnboardingFrontendPostgresE2E são retidos no código, mas o seletor de classes *Test/*Tests não os executa neste workflow. Não são contados como cobertura.

| Entrada Java | Config ou script | Projeto | Seleção | Publicação na falha |
|---|---|---|---|---|
| MilestoneRemediationBrowserTest | tests/e2e/playwright.milestone-remediation.config.ts | review-sao-paulo | remediation + recovery (18) | comum, validado |
| FrontendClosureBrowserTest | tests/e2e/playwright.frontend-closure.config.ts | review-sao-paulo | closure + visual (6) | comum, validado |
| Cf014HistoryDiagnosticTest | tests/e2e/playwright.cf014-history.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Cf014HistoryReviewTest | tests/e2e/playwright.cf014-history-review.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Cf019Rva03DiagnosticTest | tests/e2e/playwright.cf019-rva03.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| FinancialJourneyPostgresE2E | tests/cf032/playwright.config.ts | default; fusos definidos por caso | 13 jornadas (smoke6); calendário por caso | comum, validado |
| HabitBrowserIntegrationTest | src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs | programmatic; contexto São Paulo | Uma jornada de script; assertions originais | comum, validado |
| UserIsolationBrowserIntegrationTest | src/test/java/com/controlefinanceiro/api/infra/security/browser.cjs | programmatic; contexto São Paulo | Uma jornada de script; assertions originais | comum, validado |
| IntegratedMilestoneBrowserReviewTest | tests/e2e/playwright.milestone-review.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rf15IndependentBrowserTest | tests/e2e/playwright.rf15-independent.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rf15RemediationBrowserTest | tests/e2e/playwright.rf15.config.ts | review-sao-paulo | Universo25 → B2 exatos → C23 | comum, validado |
| Rf15ResidualBrowserTest | tests/e2e/playwright.rf15-residual.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rf15ResidualIndependentBrowserTest | tests/e2e/playwright.rf15-residual-independent.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rv24CreationBrowserIntegrationTest | tests/e2e/playwright.rv24.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rvr24ReviewBrowserTest | tests/e2e/playwright.rvr24-review.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |
| Rvr24VisualBrowserTest | tests/e2e/playwright.rvr24-visual.config.ts | review-sao-paulo | testMatch/grep do config original | comum, validado |

Cada fronteira Java usa BrowserEvidence.start/waitFor. Comandos, opções de seleção, ambientes, fixtures e deadlines originais permanecem. CWD: frontend físico, confirmado por physicalPath. O financeiro chega por seu runtime/frontend e resolve a mesma pasta física. Scripts programáticos mantêm uma identidade de jornada por entrada; não se inventam casos Playwright test-runner para suas assertions internas. O projeto e worker dos testes CLI vêm do reporter. RV24 conserva a alternativa R03 do config milestone-review.

Comando comum CLI: node cli.js test --config CONFIG e argumentos originais. RF15 mantém zoom-browser, plano A25/B2/C23 e verifyDirectory, com o reporter comum somente na seleção C. Scripts programáticos preservam node SCRIPT e argv; preload registra lançamento real de navegador, sem URLs/headers. O preloader apenas observa e devolve erros/códigos originais.

Saídas privadas por run/attempt/job: browsers/Classe/diagnostics/{invocation,process,events-list,events-run,browser-events-run,list.log,run.log}; RF15 também mantém zoom-selection e boundary.log. Financeiro usa browser/diagnostics e preserva browser/playwright.json consumido pelo gate. stdout/stderr do launcher continuam mesclados no playwright.log original. Capturas, traces, HTML, mailbox, SQL e payloads continuam privados.

Ordem: execução → recibo de deadline Java antes do kill → teardown original → Maven retorna → result.json → collectPublic/sanitização → upload → post-job cleanup. Falha de sanitização bloqueia public/ e publica somente collection-status.json com código constante, em artifact próprio. Nenhum bruto alternativo. Falhas de instalação/preparação deixam plano de wrappers e primeiro erro sanitizado do gate; o registro distingue ausência de recibo, ausência de navegador observado e coleta de cenários.

Publicação comum: public/browsers/Classe/diagnosis.json, com contexto, comando, expected/started/finished, primeiro erro, restante, browserStarted, termination, missing e hashes de inputs. browserStarted=null significa ausência de evidência, não prova de que iniciou. Relatório incompleto nunca aprova o gate.

SAN-E2 grava em finally largura, última observação, motivos, viewport/DPR, retângulos, área, fontes e métricas já usadas pelo probe. A leitura adicional leve do DOM ocorre após a assertion e tem timestamp próprio; não adiciona screenshots ao polling. O helper de aceite e o limite15s permanecem.

Modo diagnostic: Windows obrigatório e mesma preparação Linux de frontend/browser/Java; seleciona somente Milestone+RF15 e não gera JAR. O check diagnostic-not-acceptance rejeita esse modo pelo avaliador oficial; não pode satisfazer required. Smoke e expanded oficiais conservam suas dependências e critérios.

Provas locais: contratos parametrizados cobrem conexão dos16, coexistência, ausências, sentinelas e fail-closed; controles reais Linux cobrem as16 entradas com falha pré-reporter, cenário falho e sucesso (48); deadline real pelo adaptador Java preserva caso parcial e código31; contraprovas RR3-01 permanecem. Recibos e runtimes externos constam do parecer desta execução.

Diagnóstico focado adicional: input diagnostic_target=san-e2 executa somente MilestoneRemediationBrowserTest com grep pelo título completo SAN-E2-visual, com âncora final (o Playwright prefixa projeto e arquivo). A opção pair continua padrão. Ambos existem apenas em diagnose; required mantém a rejeição do modo parcial. O consumidor pode reter em memória as três capturas A/B/C já feitas, sem captura adicional por polling; após a assertion, publica somente raster numérico do recorte limitado a8192 pixels e estilos pertinentes. Nenhum critério do oracle, timeout ou threshold foi alterado. Controle de retenção comprova três capturas, restauração e resultado original preservado; raster completo passa pela sanitização.
