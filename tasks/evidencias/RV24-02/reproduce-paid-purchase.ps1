param([string]$RunName = ('paid-purchase-' + [guid]::NewGuid().ToString('N')))
$ErrorActionPreference = 'Stop'
if ($RunName -notmatch '^[a-z0-9-]+$') { throw 'Nome de execução inválido.' }
$rvRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$rvBackend = Join-Path $rvRoot 'controle-financeiro-backend'
$rvCopy = Join-Path $rvBackend ('target/rv24-causal-' + [guid]::NewGuid().ToString('N'))
$rvEvidence = Join-Path $PSScriptRoot $RunName
if (Test-Path -LiteralPath $rvEvidence) { throw 'Preservar execução existente; escolha outro nome.' }
New-Item -ItemType Directory -Path $rvCopy,$rvEvidence | Out-Null
foreach ($rvPart in @('src','.mvn','pom.xml','mvnw.cmd')) { Copy-Item -LiteralPath (Join-Path $rvBackend $rvPart) -Destination $rvCopy -Recurse }
$rvService = 'src/main/java/com/controlefinanceiro/api/service/UserService.java'
$rvBefore = (Get-FileHash -LiteralPath (Join-Path $rvBackend $rvService)).Hash
$rvOriginal = & git -C $rvRoot show ('30211b8:controle-financeiro-backend/' + $rvService)
if ($LASTEXITCODE -ne 0) { throw 'Base histórica ausente.' }
[IO.File]::WriteAllText((Join-Path $rvCopy $rvService),($rvOriginal -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
$env:JAVA_HOME = (Resolve-Path (Join-Path $rvBackend 'target/temurin21/jdk-21.0.12.1+1')).Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
& (Join-Path $rvCopy 'mvnw.cmd') -f (Join-Path $rvCopy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Rv24DeletionIntegrationTest#ordinaryPaidPurchaseAllocationMustAlsoDeleteWithoutForeignKeyFailure' test *> (Join-Path $rvEvidence 'backend-red.log')
$rvExit = $LASTEXITCODE
$rvReport = Join-Path $rvCopy 'target/surefire-reports/TEST-com.controlefinanceiro.api.service.Rv24DeletionIntegrationTest.xml'
[xml]$rvXml = Get-Content -LiteralPath $rvReport -Raw
Copy-Item -LiteralPath $rvReport -Destination (Join-Path $rvEvidence 'red.xml')
if ($rvXml.testsuite.tests -ne 1 -or $rvXml.testsuite.failures -ne 1 -or $rvXml.testsuite.errors -ne 0 -or $rvXml.testsuite.skipped -ne 0 -or $rvXml.OuterXml -notmatch 'card_payment_allocations_card_transaction_id_fkey') { throw 'O teste não detectou causalmente a FK esperada.' }
if ((Get-FileHash -LiteralPath (Join-Path $rvBackend $rvService)).Hash -ne $rvBefore) { throw 'Fonte de produto mudou durante a contraprova.' }
@{ historical_service='30211b8'; current_source_unchanged=$true; source_sha256=$rvBefore; isolated_copy=$rvCopy; maven_exit=$rvExit; failures=1; errors=0; skipped=0; cause='FK card_payment_allocations -> card_transactions, ordinary paid purchase' } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $rvEvidence 'result.json')
Get-Content -LiteralPath (Join-Path $rvEvidence 'backend-red.log') -Tail 12
