# Execuções independentes CF-024

Executadas em 30/09/2026 local, com consolidação documental em01/10 (logs UTC podem mostrar01/10). Base `f225657`, produto `dbf828e`, Windows/PowerShell, Temurin21.0.12.1, Maven wrapper do projeto, PostgreSQL16-alpine/Testcontainers. Acesso inicial ao cache Maven falhou no sandbox; repetição autorizada fora desse limite executou os testes. Nenhuma falha financeira foi corrigida para passar.

## Inventário verificável

| Execução / artefato | Onde | Resultado e interpretação |
|---|---|---|
| direcionados.log | checkout | Falha de compilação/acesso ao cache Maven; nenhum teste executado |
| direcionados-runtime.log | checkout | Classe final CF-024:30/30, inclusive deadlock real |
| probes-primeiro.log/.xml | cópia inicial |14 casos,13 verdes/1 falha: esperado wrapper Spring, obtido Hibernate ConstraintViolationException; FK real reproduzida |
| probes-final.log/.xml | cópia inicial |15/15; tipo de exceção corrigido no harness e caso de versão real adicionado |
| exclusao-contrato-red.log/.xml | cópia inicial |1 falha causal: exclusão deveria completar, mas viola FK; não faz parte do gate verde |
| consumidores-componentes.log | frontend checkout, sem fonte alterado |18/18 em cinco arquivos pertinentes |
| consumidor-desconhecido-red.log | componente temporário no frontend, removido ao terminar |1 falha causal: segunda submissão chama serviço; esperado1/obtido2 |
| afetados-verify.log | checkout |119 testes,0 failures/1 error/0 skipped; timeout de scheduler H24-01, BUILD FAILURE |
| afetados-threads.txt | JVM30564 dessa execução |Thread dump durante atraso; não encerra causa do timeout |
| pertinentes-verify-final.log | checkout |99/99, verify e JAR; seleção pertinente abaixo; não apaga a execução119 |
| scheduler-isolado.log | checkout |1/1 do mesmo callback,10s inalterados; causa da falha ampliada permanece aberta |
| mutacoes/ + mutacoes-execucao.log | nova cópia isolada |Cinco mutações,13 falhas causais/0 errors/0 skipped; restauração30/30 e SHA coincidente |
| upgrade-v12-validate.log | cópia inicial |1 error de fixture: faltava created_at obrigatório no seed |
| upgrade-legado-final.log | cópia inicial |2 casos: legado passou, upgrade falhou por inventário incluindo linha SCHEMA/versionnull |
| upgrade-reservas.log | cópia inicial |2/2: V12→V13 com validate e concorrência com reserva700 |
| final/backend.log, final/results.json, final-orquestracao.log | nova cópia final |22/22:17 casos review*,1 upgrade,4 correção herdada; zero errors/skips; fontes originais idênticas por SHA |

**Não somar contagens:** há sobreposição entre gates, restauração, reruns e subclasses. A seleção `#review*` exclui os30 testes herdados da subclasse; o contrato vermelho de exclusão é selecionado separadamente. O conjunto final22 inclui17 probes positivos e não inclui os dois contratos vermelhos, que continuam publicados como defeitos.

O executor havia publicado verify388 incluindo29CF-024; o30º teste de deadlock foi executado depois em cópia restaurada. Essa distinção foi conferida nos logs históricos e hashes, não convertida em alegação de verify389. Nesta revisão o gate99 executou a classe final30 no checkout. Frontend histórico157/typecheck não foram repetidos integralmente; somente os18 pertinentes e o novo componente vermelho. O checkpoint verifica fontes finais, não uma identidade falsa do JAR histórico.

## Comandos e seleções

Na raiz, ambiente usado (não imprime segredos):

```powershell
$env:JAVA_HOME = (Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
```

Invocação padrão do checkout:

```powershell
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=SELECAO' '-Duser.timezone=UTC' test
```

Substituir SELECAO pelas seleções efetivamente usadas abaixo; gate pertinente/ampliado usou `verify` em vez de `test`. Os logs reais correspondentes estão na tabela. `-Duser.timezone=UTC` registra invocação, não certifica timezone efetivo depois de startup: o app altera o default para São Paulo; oracles usam datas/relógios explícitos.

- Direcionada: `Cf024ConcurrencyCacheIntegrationTest`.
- Ampliada: `Cf024ConcurrencyCacheIntegrationTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,IncrementalMilestoneReviewTest,HabitIntegrityIntegrationTest,TransactionServiceTemporalTest,InvestmentServiceTemporalTest,IndependentRemediationBoundaryTest,IndependentJointReviewIntegrationTest,MilestoneTransactionCommandTest,Cf018RegressionIntegrationTest,Cf020InvestmentGoalIntegrationTest`. IndependentJointReviewIntegrationTest não existia e não foi executado; a contagem119 vem das suítes reais no log, sem atribuir cobertura a esse nome.
- Gate pertinente: `Cf024ConcurrencyCacheIntegrationTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,IncrementalMilestoneReviewTest,HabitIntegrityIntegrationTest#v11UpgradePreservesLegacyCalendarAndDoesNotInventGoalIdentity,TransactionServiceTemporalTest,InvestmentServiceTemporalTest,IndependentRemediationBoundaryTest,MilestoneTransactionCommandTest,Cf018RegressionIntegrationTest,Cf020InvestmentGoalIntegrationTest,HttpContractControllerTest`.
- Scheduler isolado: `HabitIntegrityIntegrationTest#independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock`.

O gate pertinente limita hábitos ao teste efetivamente ajustado pela V13 e inclui contratos HTTP. A execução ampliada foi mantida inteira e H24-01 continua aberto; não houve alteração de assertions para tornar99 verde.

Reprodução da consolidação em nova cópia, mantendo evidências existentes:

```powershell
& tasks/evidencias/revisao-CF-024/run-probes.ps1 -RunName nova-execucao
```

O script gera cópia única em target, adiciona os dois probes Java, seleciona `Cf024IndependentReviewTest#review*,Cf024V12UpgradeReviewTest,MilestoneInvestmentCorrectionTest`, registra casos/resultado e compara todo src original. Recusa reaproveitar RunName. A execução desta revisão usou `-RunName final`. Cópia final exata está em `final/results.json`; cópia inicial em `copy-path.txt`. O teste vermelho de exclusão pode ser selecionado nessa cópia com `-Dtest=Cf024IndependentReviewTest#contractLinkedDeletionMustCompleteWithoutForeignKeyFailure`; expectativa é falhar na base auditada.

Mutações: executado `& tasks/evidencias/CF-024/mutations.ps1`, script original preservado, em nova cópia `controle-financeiro-backend/target/cf024-mutations-e5aae81266ee4d539e924bca3edd250c`. Seu diretório evidence foi copiado para `mutacoes/`; nenhuma evidência anterior foi sobrescrita. O script restaura cada mudança e compara SHA antes de executar toda a classe limpa.

| Mutação | Falhas causais observadas | Contrato que a detectou |
|---|---:|---|
| source-protection (retira lock da conta e Version) |1| Conta esperada600, obtida800: atualização perdida entre cartões |
| idempotence (desliga replay/complete) |2| Aporte esperado800, obtido600; transferência esperada700, obtida400 |
| cache-before-commit (listener síncrono) |7| Cache removido antes do commit/no rollback/fora de transação |
| fingerprint (ignora comparação) |2| Conteúdo incompatível recebe200 em vez de409 |
| receipt-owner (GET sem owner) |1| Outro owner recebe200 em vez de404 |

Os13 resultados são failures de assertions, não errors de ambiente; diffs exatos, restauração e resultados estão em `mutacoes/mutation-results.json` e logs individuais. Fontes restauradas iguais ao checkout;30/30 depois da restauração.

Frontend, cwd `controle-financeiro-frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/bff-contract.test.tsx tests/component/milestone-payment-intent.test.tsx tests/component/milestone-transaction-command.test.tsx tests/component/cf015-payment-reconciliation.test.tsx tests/component/goals-investments-habits-annual-audit.test.tsx
```

Para a contraprova RV24-01, o arquivo `probes/unknown-creation.test.tsx` foi copiado temporariamente para `tests/component`, executado sozinho pelo mesmo Vitest/config e removido em finally. O teste usa mocks de modal/toast/serviço, não representa rede real. Fonte do componente permanece intacta. O probe PostgreSQL separado prova a semântica sem chave.

## Auditoria dos testes e correções do harness

- Upgrade de hábitos fixa target12 para preservar sua prova V11→V12 e a assertion de uma migration. V13 é demonstrada por banco vazio/legado e pelo novo upgrade V12→V13 com dados.
- Inventários gerais passam a V1–V13 (e recuperação V2–V13) pela nova migração, sem apagar validação/ownership/saldo.
- Testes temporais recebem mock só do novo colaborador de transporte; datas e horários esperados não foram afrouxados.
- Assertions de espera das mutações são feitas depois da ação SQL relevante, mantendo barreiras, integridade e rollback; não usam sleep.
- Probe de exclusão: ajustado somente wrapper esperado para Hibernate ConstraintViolationException e FK real, pois EntityManager não aplicou tradução Spring Data. Assertions de estado foram conservadas. Um teste separado mantém a promessa funcional como vermelho; a observação verde de rollback não esconde o defeito.
- Seed do upgrade: incluído created_at exigido pelo schema V12; não mudou expected financeiro.
- Inventário Flyway: consulta limita type='SQL' para versões1..13 e verifica separadamente que a linha sem versão é SCHEMA. Não se removeu versão para atingir contagem artificial.
- Logs iniciais dessas falhas permanecem ao lado dos reruns. Fonte de produto e migrações não sofreram reparos.

## Preservação e publicação

```powershell
node tasks/evidencias/revisao-CF-024/verify-evidence.cjs
node tasks/evidencias/revisao-CF-024/sanitize-evidence.cjs
```

O primeiro confere300 hashes normalizados de fontes históricas, logs antigos, ancestralidade, ausência de diff de produto, README e gates; grava checkpoint. O segundo foi aplicado às novas evidências após terminarem as execuções: remove JWT/credenciais sintéticas, conserva dinheiro/status/assertions e publica SHA original/publicado em evidence-sha256.json. Os arquivos de evidência bruta têm -text no .gitattributes para preservar bytes no Git. Não rodar novamente a sanitização sobre os mesmos artefatos para substituir a proveniência original.

README raiz preservado: `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`. Nenhum resultado desta revisão autoriza CF-025 implementada, release, banco real ou envio externo.
