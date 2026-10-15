# Execuções e limites de reprodução

Na raiz, com Java21 local e Docker Testcontainers:

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf014HistoryReviewTest' '-Duser.timezone=UTC' test
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf014HistoryReviewTest' '-Ddiagnostic.run=causal-settled' '-Ddiagnostic.grep=contraprova causal' '-Duser.timezone=UTC' test
```

Para reproduzir futuramente, usar diagnostic.run com pasta nova: não sobrescrever
browser/causal-settled. PostgreSQL16 descartável, Flyway e Hibernate validate;
BFF/backend reais, doubles apenas EmailService/MarketDataService. Chromium local,
São Paulo/360×800/no-preference; JVM UTC. Expect15s, timeout90s, retries0 originais.

Na pasta frontend:

```powershell
node node_modules/eslint/bin/eslint.js tests/e2e/cf014-history-review.integrated.spec.ts tests/e2e/playwright.cf014-history-review.config.ts tests/e2e/support/civil-date-clock.ts tests/e2e/cf014-history-diagnostic.integrated.spec.ts tests/e2e/rf15-matrix.integrated.spec.ts
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
node node_modules/eslint/bin/eslint.js tests/e2e/cf014-history-diagnostic.integrated.spec.ts
```

Primeira rodada: maven.log BUILD FAILURE, Playwright4/5 aprovados; controle nativo
falha em assertion síncrona de ancestral ainda animando. Histórico já opacity1;
causa específica e correção em PROBE.md. Date-only causal, harness civil e jornada
original adaptada passam. Snapshot financeiro antes/depois igual apesar da falha.
Lint inicial e typecheck exit0. Lint repetido somente para probe alterado.

Sem suíte global ou build de produto: alterações exclusivas de testes, frontend
compilado/servido na execução integrada. Nenhuma operação financeira nova: fixture
SQL preparada antes do browser; login é a única escrita de sessão necessária.

Prova anterior do executor: nove linhas de histórico comparadas por sete campos
selecionados, mais contagens de transações/recibos. Não certifica banco inteiro.
Esta revisão acrescenta comparação ordenada de TODAS as colunas (row_to_json)
de investments, invest_transactions, accounts, transactions, financial_intent_receipts.
São3 investimentos/9 históricos, demais tabelas vazias. Não inclui users/sessões,
sequências nem prova ausência de escrita transitória revertida. Observadores HTTP
complementam a ausência de comandos financeiros nas jornadas; sem alegação de
reconciliação financeira para esta fixture artificial de leitura.

Rodada causal-settled:3/3 Playwright, Maven BUILD SUCCESS; snapshot financeiro completo igual. Lint-settled exit0. Cinco cenários distintos cobertos ao final, preservada a falha anterior.
Typecheck final exit0 após o reparo do probe. Após os gates, apenas formatação das chaves/fim de arquivo Java; nenhuma alteração executável.
