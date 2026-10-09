# Execuções e causalidade

## Reprodução anterior à correção

No frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/directed-temporal-review.test.tsx
```

`frontend-before.log`: EPERM no rename do cache TEMP, zero testes. A ferramenta
autorizou o mesmo comando fora da restrição de cache; `frontend-before-authorized.log`:
2 falhas causais (ano e rótulo), 1 controle aprovado. Nenhum retry de assertion.

No backend, preparação JDK21 e Docker usada em todos os comandos:

```powershell
$env:JAVA_HOME=(Get-Content ../tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt -Raw).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=DirectedGoalHistoryTemporalTest' '-Duser.timezone=UTC' test
```

`backend-before.log`: Docker indisponível dentro do sandbox, falha de infraestrutura.
`backend-before-authorized.log`: mesmo comando autorizado com Docker, 1 falha causal,
0 erros/ignorados. SQL date=2026-09-08 00:10:00; GET sem offset; esperado03:10Z.
Não se contam as falhas de infraestrutura como detecção dos defeitos.

## Pós-correção e complementos

Frontend, seleção final executada no diretório frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/directed-temporal-review.test.tsx tests/component/rd58-annual-year.test.tsx tests/component/rd58-history.test.tsx tests/component/temporal-forms.test.tsx tests/component/temporal-navigation.test.tsx tests/component/temporal-presentation.test.tsx tests/component/temporal-compatibility.test.tsx tests/component/habit-product-day.test.tsx tests/component/planning-edit.test.tsx tests/component/http-contract.test.tsx tests/component/bff-contract.test.tsx tests/component/user-session-review.test.tsx
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build
```

- `frontend-after.log`: 73 aprovados/3 erros no novo arquivo rd58-history por falta
  do contexto useUser exigido por PrivacyBlur. Adicionado o mesmo mock de usuário
  dos probes, sem neutralizar calendário/label. Nenhuma assertion alterada.
- `history-after.log`: os 4 testes do arquivo corrigido passam.
- `frontend-delivery.log`: 76/76, 12 arquivos, incluindo as duas provas originais,
  seu controle, 5 cenários de ano/query e 4 de histórico.
- `lint.log`, `typecheck.log` e seus `*-delivery.log`: exit0. Logs vazios significam
  ausência de diagnóstico, não teste funcional adicional.
- `frontend-build.log`: build de produção aprovado, exit0. Aviso preexistente de
  convenção middleware/proxy; nenhuma mudança de configuração para escondê-lo.

Backend, seleção final com a preparação acima:

```powershell
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=DirectedGoalHistoryTemporalTest,GoalHistoryRecordedInstantIntegrationTest,GoalHistoryUpgradeTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,HabitServiceTemporalTest,Cf020GoalAllocationTest,HabitIntegrityIntegrationTest,Cf020InvestmentGoalIntegrationTest,TemporalConfigTest,TemporalJsonContractTest,TemporalBoundaryReviewTest,TemporalCompatibilityIntegrationTest,PostgreSqlTemporalRoundTripTests' '-Duser.timezone=UTC' verify
```

- `backend-after.log`: 109 testes, 107 aprovados, 1 falha/1 erro. As provas de
  produto passaram. Falha: contagem de migrações recuperadas ainda esperava12
  após acrescentar V14 (agora13 após V1). Erro: fixture SQL nova omitia deadline
  NOT NULL; acrescentado deadline literal. Nenhum critério temporal foi afrouxado.
- `backend-thread-diagnostic.log`: captura de pilhas durante aparente ausência de
  progresso no log. JVM estava em geração de mock; execução avançou normalmente.
  Nenhum timeout ampliado, teste interrompido ou retry automático.
- `backend-final.log`: 11/11 e build JAR aprovado; seleção das cinco classes
  de probe/integração/migrações. Integração passou a usar explicitamente Flyway/
  Hibernate validate em schema descartável; não apenas schema criado pelo ORM.
- `backend-delivery.log`: rodada final ampliada após adicionar os três defaults JVM
  e falha do INSERT para rollback. Resultado consolidado em `verification.json`.

JUnit/Mockito/ORM podem registrar exceções esperadas de casos negativos; resultado
é o resumo Surefire, não a mera presença de ERROR no log. Arquivos `.exit` guardam
o exit code de cada comando. Não somar rodadas sobrepostas como testes únicos.
`backend-results.json` guarda somente resumo/casos das classes selecionadas,
sem copiar system properties ou tokens dos XMLs completos de target.

## Garantias da evidência

Probes independentes conferidos pelo SHA256 no baseline e na verificação final.
Nenhuma mutação/restauração necessária: os próprios defeitos anteriores forneceram
o controle vermelho, e nenhuma árvore isolada com mutação foi criada. Nenhuma
assertion independente alterada, skip/quarentena/retry/timeout relaxado.

O script de sanitização da revisão foi copiado para esta pasta e executado somente
depois do fechamento dos logs. `sanitization.json` registra hashes de entrada/saída
e redação de eventuais credenciais sintéticas. Nenhum log histórico regravado.
Staging explícito e diff staged inspecionado por commit. README raiz preservado;
o resultado do commit final e intervalo completo constam na entrega do chat.
