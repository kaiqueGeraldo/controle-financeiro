# Execuções — 14/10/2026

Candidato0f9beb1, produto intacto. Node24.18.0, Vitest4.1.11, Chromium Playwright local, Temurin21, PostgreSQL16 descartável/Flyway real. Clock backend/auth15jan2027, JVM UTC, browser São Paulo. E-mail/cotação falsos; requisições financeiras reais BFF→Spring→PostgreSQL. Sem retries automáticos, timeout maior ou alteração das provas originais.

| Arquivo | Resultado |
|---|---|
| components-wide.log | Nenhum teste executado;26 arquivos falharam por EPERM no rename de cache temporário do sandbox. Não confundir com falha de produto ou timeouts do executor |
| components-wide-permitted.log | Mesma seleção/configuração/paralelismo padrão, sem browser/build concorrente:219/219,26/26 arquivos,17,25s |
| browser.log + browser/playwright.log | Sete jornadas originais/complementares existentes passam,1,8min no Playwright; Maven1 orquestrador aprovado |
| interaction.log + interaction/playwright.log | Uma jornada suplementar de recuperação tardia,32,1s, com clique/digitação/hit-test/Escape e SQL real; Maven aprovado |
| cleanup.log | Um probe novo de cleanup StrictMode/ciclos repetidos passa;132ms no teste |
| lint.log, typecheck.log, build.log | exit0, sequência final após encerrar browser; static-results.json |

Contagem:219 casos únicos do lote amplo incluem a reprodução original e os19 complementares do executor. O novo cleanup acrescenta1 caso:220 componentes únicos exercitados. As sete jornadas de navegador não se somam às execuções históricas como novos casos; a oitava execução repete late-recovery com garantias adicionais de interação/pintura. Não somar13 isolados do executor aos219 desta revisão. O EPERM não executou cenário algum.

Nenhum componente de produto foi editado. Teste de cleanup mede subscriptions, sem substituir implementação. Jornada de interação deriva do roteiro late-recovery e acrescenta ações/verificações; harness novo conserva a fronteira e SQL do harness existente, mudando classe/config/pasta de saída. Nenhum teste original foi alterado. Contraprovas vermelhas independentes anteriores foram reutilizadas com integridade conferida; não houve mutação na árvore principal.

## Comandos reproduzíveis

Na raiz, JAVA_HOME aponta para controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1 e bin integra PATH. Docker local disponível. Usar pasta nova para não sobrescrever provas.

```powershell
npm.cmd --prefix controle-financeiro-frontend run test:component -- rf15- rvr24-visual-instance rv24- common-ui-accessibility sidebar-accessibility auth-settings-accessibility dashboard-accounts-extract cards-planning-audit goals-investments-habits-annual-audit cf015-invoice-focus cf015-recovery-expanded cf015-payment-reconciliation cf015-reconciliation-lifecycle precision-decimals precision-boundary
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rvr24VisualBrowserTest' '-Dreview.evidence=../../revalidacao-RVR24-02-ciclo-visual/browser' '-Dreview.grep=visual real|resposta tardia|investimento confirmed|investimento lost|investimentos histórico' '-Duser.timezone=UTC' test
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rvr24ReviewBrowserTest' '-Duser.timezone=UTC' test
npm.cmd --prefix controle-financeiro-frontend run test:component -- rvr24-review-cleanup --maxWorkers=1
npm.cmd --prefix controle-financeiro-frontend run lint
npm.cmd --prefix controle-financeiro-frontend run typecheck
npm.cmd --prefix controle-financeiro-frontend run build
```

O lote219 não inclui rvr24-review-cleanup; esse foi executado separadamente após ser acrescentado. Suíte backend ampla não repetida: impacto concentrado no consumidor frontend, com backend real apenas nos caminhos de persistência necessários. Sem banco real, pagamentos novos de fatura, zoom artificial ou nova auditoria integral.
