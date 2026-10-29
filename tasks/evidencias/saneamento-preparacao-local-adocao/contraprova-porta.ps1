param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
$taskAllowed=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')
if (!$taskRoot.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase)) {throw 'Sanitation runtime required'}
$taskSource=Join-Path $taskRoot 'checkout/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java'
$taskBytes=[IO.File]::ReadAllBytes($taskSource)
$taskBefore=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash
$taskText=[Text.Encoding]::UTF8.GetString($taskBytes)
$taskMutant=$taskText.Replace('port = 0;', 'try (var socket = new java.net.ServerSocket(0)) { port = socket.getLocalPort(); }').Replace('image == null ? 0 : 8080','image == null ? port : 8080')
if ($taskMutant -eq $taskText) {throw 'Mutation did not apply'}
$taskJar=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar')
try {
 [IO.File]::WriteAllText($taskSource,$taskMutant,[Text.UTF8Encoding]::new($false))
 $taskMutantHash=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash
 Push-Location -LiteralPath "$taskRoot/checkout/controle-financeiro-backend"
 try {& ./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf017.postgres.major=17' '-Dtest=AdoptionPortAllocationTest' "-Dpreparation.jar=$taskJar" "-Dcf034.reportsDirectory=$taskRoot/port-mutant-reports" test *> "$taskRoot/port-mutant.log"; $taskExit=$LASTEXITCODE} finally {Pop-Location}
} finally {[IO.File]::WriteAllBytes($taskSource,$taskBytes)}
$taskAfter=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash
if ($taskBefore -ne $taskAfter) {throw 'Source restoration mismatch'}
$taskLog=Get-Content -Raw -LiteralPath "$taskRoot/port-mutant.log"
if ($taskExit -eq 0 -or $taskLog -notmatch 'Tests run: 1, Failures: 1, Errors: 0, Skipped: 0' -or $taskLog -notmatch 'Port \d+ was already in use') {throw 'Causal port mutation not detected; failure retained'}
[ordered]@{before=$taskBefore;mutant=$taskMutantHash;restored=$taskAfter;exit=$taskExit;detectedByPortCollision=$true;tests=1;failures=1;errors=0;skipped=0} | ConvertTo-Json | Set-Content -LiteralPath "$taskRoot/port-mutant.json" -Encoding utf8NoBOM
Write-Output 'OLD_PORT_ALLOCATOR=DETECTED; SOURCE_SHA256=RESTORED'
