# Comandos e reprodução local

Registro em PowerShell. p01–p05 são execuções preservadas, não destinos para
reexecutar testes. Os scripts recusam substituir vários recibos/diretórios.
Para reprodução, escolher execução **nova** dentro de preparacao-adocao e
preservar a primeira tentativa, inclusive falhas. Não usar banco real nem carregar
.env de aplicação. Docker/Testcontainers criam bancos/schemas sintéticos.

## Preparação e rodadas originais

Da raiz do repositório, prepare.mjs exporta fontes permitidas, não target,
node_modules, .next, .env, README raiz ou documentação geral. Confere os29 arquivos
históricos e hashes/blobs dos inputs. Exemplo para uma nova revisão autorizada:

```powershell
$repo = (Get-Location).Path
$runtime = [IO.Path]::GetFullPath((Join-Path $repo '../controle-financeiro-runtimes/preparacao-adocao/revisao-01'))
$jdk = Join-Path $repo 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1'
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk/bin;$env:PATH"
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $runtime
$backend = Join-Path $runtime 'checkout/controle-financeiro-backend'
$frontend = Join-Path $runtime 'checkout/controle-financeiro-frontend'
```

Não reexportar em cima de p01–p05. Os diretórios originais e revisões:

| Runtime | Inputs / finalidade |
|---|---|
| p01 | Base46b85ee mais seleção PG17 no helper de teste; reproduziu recusa da ferramenta |
| p02 | Implementação em desenvolvimento; primeira matriz e lint/tipagem/BFF |
| p03 | 8605ea425706c82328ceb6e0283644b8dbe976a2; PG17, required PG16 e frontend |
| p04 | Mesmos inputs de p03; mutações isoladas e controle restaurado |
| p05 | 24844b594e4ed8fe906e0fc6eaee32bdd58f31a0; fixture final, pacote/imagem e E2E |

Matriz PG17 p03, na pasta backend exportada:

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=17' '-Dspring.test.context.cache.maxSize=4' '-Dtest=TemporalCompatibilityIntegrationTest,EmailMaintenanceTest,HealthControllerTest,AdoptionRuntimeTest,Cf017ManifestTest,Cf017OriginalFindingsTest,Cf017PreflightTest,Cf017RestoreTest,EmptyDatabaseMigrationIntegrationTest,GoalHistoryUpgradeTest,LegacyDatabaseMigrationIntegrationTest,SchedulingBoundaryTest' "-Dcf034.reportsDirectory=$runtime/pg17-reports" verify
```

A seleção required PG16 e os argumentos literais de p03 estão em
backend-selection.json e pg16-command.json. O script abaixo selecionou98 classes
pela política existente, separando AdoptionRuntimeTest, exercitado com processos
e PG17. Não foi uma execução de CI remota:

```powershell
node tasks/evidencias/preparacao-local-adocao/backend-regression.mjs $runtime
```

Depois da correção explícita da fixture de scheduling (commit24844b5), p05 fez
somente a revalidação dos58 casos afetados e empacotou com verify:

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=16' '-Dspring.test.context.cache.maxSize=4' '-Dtest=HabitIntegrityIntegrationTest,HabitFixtureIsolationIntegrationTest' "-Dcf034.reportsDirectory=$runtime/habit-reports" verify
```

Não usar skipTests como evidência. O verify de p05 executou a seleção acima,
não a suíte integral. Coletores confrontam fontes/nome dos casos entre rodadas.

## Pacote e imagem

Da raiz do repositório, stage exige inputs iguais aos blobs commitados e copia o
JAR gerado para pasta nova. verify não executa testes; confere fontes e SHA:

```powershell
node tasks/evidencias/preparacao-local-adocao/package.mjs stage $runtime
node tasks/evidencias/preparacao-local-adocao/package.mjs verify $runtime
& ./tasks/evidencias/preparacao-local-adocao/verify-resources.ps1 -Runtime $runtime
```

JAR nativo p05: na pasta backend exportada, os17 casos usaram o arquivo de stage,
sem recompilar o JAR. A invocação terminou com três falhas de startup preservadas:

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=17' '-Dtest=AdoptionRuntimeTest' "-Dpreparation.jar=$runtime/package/api.jar" "-Dcf034.reportsDirectory=$runtime/jar-reports" test
```

A imagem usou apenas o JAR conferido no contexto, base Java fixada, rede de RUN
desativada e sem publicar tag. Docker pode consultar metadados da base; nenhum
push faz parte desses comandos. Da raiz do repositório:

```powershell
$receipt = Get-Content -Raw -LiteralPath "$runtime/package/stage.json" | ConvertFrom-Json
New-Item -ItemType Directory -Path "$runtime/image-context"
Copy-Item -LiteralPath "$runtime/package/api.jar" -Destination "$runtime/image-context/api.jar"
docker build --network none --pull=false --file "$backend/Dockerfile.release" --build-arg 'JAVA_RUNTIME=eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b' --build-arg "INPUT_COMMIT=$($receipt.inputsCommit)" --build-arg "JAR_SHA256=$($receipt.sha256)" --iidfile "$runtime/image-id.txt" --tag cf-preparacao-adocao:revisao-local "$runtime/image-context"
$imageId = (Get-Content -Raw -LiteralPath "$runtime/image-id.txt").Trim()
docker image inspect $imageId
```

Na pasta backend, trocar o alvo pelo ID local exato (não uma tag mutável):

```powershell
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=17' '-Dtest=AdoptionRuntimeTest' "-Dpreparation.image=$imageId" "-Dcf034.reportsDirectory=$runtime/image-reports" test
```

O harness cria seus próprios containers UUID --rm e endereça somente o banco
Testcontainers. Snapshot/restore usam clientes da mesma major do servidor.
Saídas de processos ficam em target/adoption-processes; JUnit em cada diretório
explícito. p05 passou17/17; o controle posterior p04 falhou em dois startups com
esse mesmo ID. Conferir ambos.

O CLI do JAR também comparou os snapshots preservados, sem conectar a banco:

```powershell
& "$jdk/bin/java.exe" '-Dloader.main=com.controlefinanceiro.api.infra.migration.DatabaseVerificationCli' -cp "$runtime/package/api.jar" org.springframework.boot.loader.launch.PropertiesLauncher compare "$repo/tasks/evidencias/preparacao-local-adocao/snapshots/pg17/before" "$repo/tasks/evidencias/preparacao-local-adocao/snapshots/pg17/final"
```

## Frontend e jornadas

Na cópia frontend: npm ci pelo lockfile; lint, typecheck, test:unit,
test:component e build. BFF dirigido:
`npm run test:component -- tests/component/bff-contract.test.tsx`.
Os626 componentes já incluem os14 do BFF. p03 precisou de cópia física de
node_modules para Turbopack; log da junction falha foi preservado.

E2E p05 reutilizou frontend compilado p03 com inputs idênticos. Preparou
e2e-runtime/frontend como junction para essa cópia (não para fontes mutáveis do
produto), e01.json do oracle versionado e diretório browser novo. As variáveis
foram explícitas na sessão local; nunca se usou URL remota:

```powershell
$env:CF032_RUNTIME = "$runtime/e2e-runtime"
$env:CF032_EVIDENCE = "$runtime/browser"
$env:CF032_REPO = "$runtime/checkout"
$env:CF032_HEAD = '24844b594e4ed8fe906e0fc6eaee32bdd58f31a0'
$env:CF032_GREP = 'A cadastro|B uso diário|G resposta perdida|H dois usuários|K limite disponível|L investimento válido'
$env:VERCEL_ENV = 'development'
./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dspring.test.context.cache.maxSize=4' '-Dtest=FinancialJourneyPostgresE2E' '-Dsurefire.failIfNoSpecifiedTests=true' "-Dcf034.reportsDirectory=$runtime/e2e-reports" test
```

O harness define upstream localhost para Next e cria schema descartável antes do
navegador. EmailService/MarketDataService são doubles; HTTP/auth/domínio/ORM/SQL
são reais. Biblioteca Playwright emprestada foi comparada ao lock e auditada antes/
depois; para nova execução preferir instalação própria de browser e dependências.
Não copiar sessões/cookies/dados reais.

## Contraprovas e coleta

Da raiz, counterproofs.mjs recebe runtime isolado com inputs e o ID da imagem
original. Executa cinco mutações, compila/empacota mutantes sem testes nessa fase,
roda testes explícitos e restaura fontes por hash. Seu controle final não mascara
startup falho. package-counterproof.mjs altera somente uma cópia do JAR:

```powershell
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $runtime $imageId
node tasks/evidencias/preparacao-local-adocao/package-counterproof.mjs $runtime
```

Não repetir esses comandos em p04/p05. O modo resume foi usado apenas após
interrupção do gerador por CRLF; o modo audit conferiu os831 hashes e preservou
o resultado existente, sem executar testes novos. Recibos/logs documentam isso.

collect.mjs e toolchain.mjs são coletores **desta execução**, vinculados aos
diretórios p03/p04/p05 e à comparação p03→p05; não são um runner genérico de CI.
preservation.mjs confere README/29 arquivos/16 migrations e ancestralidade sem
restaurar automaticamente divergências. Só a coleta documental foi repetida ao
fechar recibos, sem reexecutar a suíte nem substituir os logs originais de teste.
