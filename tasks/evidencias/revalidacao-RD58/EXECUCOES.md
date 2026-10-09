# Execuções desta revalidação — 09/10/2026

Executadas no candidato `0c068d9`, sem alteração de produto. Os dois complementos
de teste foram adicionados nesta revisão; não modificam as três provas originais.
Logs e exit codes permanecem nesta pasta, fora de target. Não somar testes de
rodadas sobrepostas como casos novos.

## Frontend

No diretório controle-financeiro-frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/directed-temporal-review.test.tsx tests/component/rd58-annual-year.test.tsx tests/component/rd58-history.test.tsx tests/component/temporal-forms.test.tsx tests/component/temporal-navigation.test.tsx tests/component/temporal-presentation.test.tsx tests/component/temporal-compatibility.test.tsx tests/component/habit-product-day.test.tsx tests/component/planning-edit.test.tsx tests/component/http-contract.test.tsx tests/component/bff-contract.test.tsx tests/component/user-session-review.test.tsx
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build
```

- frontend.log: **76/76**, 12 arquivos, provas originais aprovadas.
- lint.log/typecheck.log/build.log: exit0, build Next aprovado. Aviso preexistente
  middleware/proxy, sem alteração de configuração para ocultá-lo.
- Complemento: mesmo runner apenas `tests/component/rd58-history.test.tsx`.
  frontend-bridge.log: 2 falhas do novo harness +4 aprovados; não é defeito temporal
  nem demonstração de sensibilidade. O contador global esperava2 fetches, mas o
  GoalDetails também busca `/allocations` a cada montagem, totalizando4. Labels e
  campos temporais já passavam. Fixture corrigida para responder histórico somente
  em `/history`, `[]` em `/allocations`, rejeitar rota inesperada e verificar **2
  chamadas por rota**. Preservados expected/inputs temporais e log vermelho.
- frontend-bridge-final.log: **6/6**, sendo2 casos novos de transporte/apresentação
  em UTC/Kiritimati e4 existentes. Portanto **78 casos únicos** aprovados no conjunto,
  não82. Não houve retry cego, exclusão, timeout ampliado ou alteração de produto.
- Após a correção do harness: eslint do arquivo (lint-supplement.log) e typecheck
  completo (typecheck-supplement.log), ambos exit0. A correção só afeta teste, não
  invalida o build de produto.

## Backend / PostgreSQL descartável

No diretório controle-financeiro-backend, preparação:

```powershell
$env:JAVA_HOME=(Get-Content ../tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt -Raw).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=DirectedGoalHistoryTemporalTest,GoalHistoryRecordedInstantIntegrationTest,GoalHistoryUpgradeTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,HabitServiceTemporalTest,Cf020GoalAllocationTest,HabitIntegrityIntegrationTest,Cf020InvestmentGoalIntegrationTest,TemporalConfigTest,TemporalJsonContractTest,TemporalBoundaryReviewTest,TemporalCompatibilityIntegrationTest,PostgreSqlTemporalRoundTripTests' '-Duser.timezone=UTC' verify
```

backend.log: **111 testes, zero falhas/erros/skips**, BUILD SUCCESS/JAR. Inclui prova
original, cinco eventos, três defaults JVM, cadeia vazia, upgrade V13, nulidade/bruto,
HTTP após commit/releitura, rollback de negócio e regressões de alocação/hábitos.
Erros SQL de triggers sintéticos são casos negativos esperados, não falhas do runner.

Complemento independente, mesma preparação, `-Dtest=GoalHistoryRecordedInstantIntegrationTest`
e demais argumentos iguais: backend-supplement.log **4/4**, BUILD SUCCESS. Três
casos existentes mais1 novo update ORM/auditoria/nulabilidade. **112 casos únicos**
no conjunto; não115. O novo teste salva note e tenta trocar recordedAt, depois busca
novamente e exige o instante original literal. Resumo por suíte/caso exportado sem
system properties em backend-results.json. Nenhum banco existente foi utilizado.

## Preservação, sensibilidade e limites

`node tasks/evidencias/revalidacao-RD58/verify.cjs` verifica base/ancestralidade,
README, hashes e diff vazio das provas originais, ausência de alteração produtiva,
V1–V13 intactas e critérios originais intactos. `--final` salva verification.json.
Os vermelhos causais lidos são da revisão original, não os problemas de
infraestrutura/cache relatados pelo executor. Não houve nova mutação: hashes iguais
e execução atual das mesmas assertions já fecham a sensibilidade aos três defeitos.

Comandos Docker/cache/build executados com permissão de ferramenta para os recursos
locais necessários. Sem novo navegador; justificativa por risco no parecer, não
dispensa universal de E2E. Nenhum build certifica adoção real. Sanitização de logs
com script copiado da revisão anterior registra hashes antes/depois, sem regravar
evidência histórica. Staging explícito e diff staged inspecionado; README raiz excluído.
