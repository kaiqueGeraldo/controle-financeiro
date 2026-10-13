# Registro de execuções — 13/10/2026

Candidato a991114, nenhum produto alterado. Temurin21 local, Next16.1.6, PostgreSQL16 Testcontainers e Flyway real. E-mail/cotação falsos; operações percorrem BFF/Spring/SQL descartável. JVM UTC; navegador SP/UTC/Kiritimati por cenário. Retries0, worker1 no browser, timeout90s/assert15s e timeout componente5s preservados.

| Execução | Resultado | Interpretação |
|---|---|---|
| components.log | 120/126, seis timeouts | Concorrente com compilação/browser; resultado vermelho preservado |
| components-serial.log | 121/126, cinco timeouts | maxWorkers1 ainda concorrente com browser; não prova regressão financeira |
| components-isolated.log | 126 originais passam; um probe novo falha | Sem browser/compilação concorrente; falha nova era seletor que ignorava portal |
| lifecycle-component.log | Novo probe falha em três assertions | Duas expectativas excessivas do revisor corrigidas conforme PROBE-LIFECYCLE; versões anteriores preservadas |
| lifecycle-final.log | Novo probe falha somente em onClose | P2 confirmado: callback A fecha B; efeitos globais legítimos exigidos pelo teste |
| browser.log + browser/playwright.log | 15/17 passam | Cadastro inicial excedeu navegação antes da ação RF15-01; histórico investimento opacity0 por15s |
| browser-isolated.log + browser-isolated/playwright.log | 2/2 passam | Mesmos dois casos isolados, sem mudar produto, assertions, limites ou retries |
| browser-extra.log + browser-extra/playwright.log | 3/4 passam | Hábito legítimo, investimento confirmado e resposta perdida passam; A→B falha na permanência do formulário B |
| lint-final.log, typecheck-final.log, build.log | Todos exit0 | final-static-exits.json confirma sequência final sem concorrência |

126 componentes originais únicos; um probe novo, ainda vermelho. 17 cenários originais únicos + quatro novos; os dois isolados são repetições, não novos testes. Maven conta um orquestrador por lote, não um caso de negócio. Não apresentar total como suíte totalmente verde.

Os primeiros componentes somaram timeouts quando havia concorrência; a seleção original inteira passou isolada, sem aumento de limite. Isso é compatível com latência de execução, não demonstra causa exata da máquina. auth-cold-network.json registra register200 (~8s), login200 (~2s) e navegação posterior lenta; falha anterior à ação mobile não comprova regressão RF15-01. A ocorrência visual de histórico está delimitada em ACHADOS.md.

## Comandos

Na raiz, JAVA_HOME aponta para controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1, com bin no PATH. Docker local disponível. Usar diretório novo para preservar provas.

```powershell
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15ResidualBrowserTest' '-Dreview.evidence=../../revalidacao-residual-RF15/browser' '-Duser.timezone=UTC' test
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15ResidualBrowserTest' '-Dreview.evidence=../../revalidacao-residual-RF15/browser-isolated' '-Dreview.grep=RF15-01:|Matriz CF014: investimentos' '-Duser.timezone=UTC' test
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15ResidualIndependentBrowserTest' '-Duser.timezone=UTC' test
```

No frontend:

```powershell
npm.cmd run test:component -- --maxWorkers=1 rf15- common-ui-accessibility sidebar-accessibility auth-settings-accessibility dashboard-accounts-extract cards-planning-audit goals-investments-habits-annual-audit cf015-invoice-focus cf015-recovery-expanded cf015-payment-reconciliation precision-decimals precision-boundary rv24-original-contract rv24-residual
npm.cmd run test:component -- --maxWorkers=1 rf15-review-lifecycle
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

A primeira seleção foi executada inicialmente sem maxWorkers1; agora rf15- inclui também o novo probe vermelho. Não excluir esse probe para alegar aprovação geral. Provas de mutação anteriores foram reutilizadas; nenhuma mutação de produto foi feita na árvore principal nesta rodada. Não houve nova auditoria backend decimal/idempotência: harness real somente nos caminhos financeiros pertinentes, SQL/recibo/reload conferidos. Três fixtures independentes de investimento terminam com conta980, BUY20 único; nenhum pagamento novo de fatura.
