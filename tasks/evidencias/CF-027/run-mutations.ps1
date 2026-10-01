param([string]$RunName='mutations')
$ErrorActionPreference='Stop'
if($RunName -notmatch '^[a-z0-9-]+$'){throw 'Nome inválido'}
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$taskBackend=Join-Path $taskRoot 'controle-financeiro-backend'
$taskCopy=Join-Path $taskBackend ('target/cf027-mutant-'+[guid]::NewGuid().ToString('N'))
$taskEvidence=Join-Path $PSScriptRoot $RunName
if(Test-Path -LiteralPath $taskEvidence){throw 'Preservar execução anterior'}
New-Item -ItemType Directory -Path $taskCopy,$taskEvidence | Out-Null
foreach($part in @('src','.mvn','pom.xml','mvnw.cmd')){Copy-Item -LiteralPath (Join-Path $taskBackend $part) -Destination $taskCopy -Recurse}
$taskAdapter=Join-Path $taskCopy 'src/main/java/com/controlefinanceiro/api/service/intent/internal/PostgresFinancialIntents.java'
$taskConsumer=Join-Path $taskCopy 'src/main/java/com/controlefinanceiro/api/service/InvestmentService.java'
$taskAdapterBefore=[IO.File]::ReadAllText($taskAdapter)
$taskConsumerBefore=[IO.File]::ReadAllText($taskConsumer)
$taskHashes=@{}
foreach($part in @('src/main/java/com/controlefinanceiro/api/service/intent/internal/PostgresFinancialIntents.java','src/main/java/com/controlefinanceiro/api/service/InvestmentService.java')){
 $taskHashes[$part]=(Get-FileHash -LiteralPath (Join-Path $taskBackend $part)).Hash
}
try {
 $taskAdapterMutation=$taskAdapterBefore.Replace('Propagation.MANDATORY','Propagation.REQUIRES_NEW').Replace('receipts.findByIdAndUserId(key,ownerId)','receipts.findById(key)')
 if($taskAdapterMutation -eq $taskAdapterBefore){throw 'Ponto da mutação ausente'}
 [IO.File]::WriteAllText($taskAdapter,$taskAdapterMutation)
 [IO.File]::WriteAllText($taskConsumer,$taskConsumerBefore.Replace('@Autowired private FinancialIntents intents;', '@Autowired private FinancialIntents intents; private com.controlefinanceiro.api.domain.intent.internal.FinancialIntentReceiptRepository forbiddenReceiptAccess;'))
 $env:JAVA_HOME=(Resolve-Path (Join-Path $taskBackend 'target/temurin21/jdk-21.0.12.1+1')).Path
 $env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
 & (Join-Path $taskCopy 'mvnw.cmd') -f (Join-Path $taskCopy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=FinancialIntentArchitectureTest#onlyIntentInternalsMayReferenceReceiptPersistenceOrConcreteAdapter,FinancialIntentsIntegrationTest#writersRequireEnclosingTransactionEvenWhenTheKeyIsAbsent+preexistingReceiptKeepsSnapshotTimestampOwnerAndConflictSemantics' test *> (Join-Path $taskEvidence 'backend-red.log')
 $taskExit=$LASTEXITCODE
 $taskReports=@(Get-ChildItem -LiteralPath (Join-Path $taskCopy 'target/surefire-reports') -Filter 'TEST-*.xml')
 $taskSuites=@($taskReports | ForEach-Object {
  [xml]$report=Get-Content -LiteralPath $_.FullName -Raw
  Copy-Item -LiteralPath $_.FullName -Destination $taskEvidence
  [pscustomobject]@{name=$report.testsuite.name;tests=[int]$report.testsuite.tests;failures=[int]$report.testsuite.failures;errors=[int]$report.testsuite.errors;skipped=[int]$report.testsuite.skipped}
 })
 if($taskExit -eq 0 -or ($taskSuites.tests | Measure-Object -Sum).Sum -ne 3 -or ($taskSuites.failures | Measure-Object -Sum).Sum -ne 3 -or ($taskSuites.errors | Measure-Object -Sum).Sum -ne 0){throw 'As três mutações não foram eliminadas por assertions'}
} finally {
 [IO.File]::WriteAllText($taskAdapter,$taskAdapterBefore)
 [IO.File]::WriteAllText($taskConsumer,$taskConsumerBefore)
 foreach($part in $taskHashes.Keys){if((Get-FileHash -LiteralPath (Join-Path $taskBackend $part)).Hash -ne $taskHashes[$part]){throw 'Fonte compartilhado mudou'}}
}
[pscustomobject]@{copy=$taskCopy;maven_exit=$taskExit;suites=$taskSuites;shared_sources_unchanged=$true;copy_sources_restored=$true;mutations=@('MANDATORY -> REQUIRES_NEW','recover without owner filter','InvestmentService -> internal receipt repository')} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $taskEvidence 'result.json')
Get-Content -LiteralPath (Join-Path $taskEvidence 'backend-red.log') -Tail 20
