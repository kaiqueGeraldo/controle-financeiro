param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
$taskAllowed=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')
if (!$taskRoot.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase)) {throw 'Sanitation runtime required'}
# Different directory: the guard must find adoption children without a cwd marker.
$taskSentinel=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-quiescencia-sentinela-01')
if (!$taskSentinel.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase)) {throw 'Unexpected sentinel directory'}
New-Item -ItemType Directory -Path $taskSentinel | Out-Null
$taskSource=Join-Path $taskSentinel 'AdoptionSentinel.java'
'class AdoptionSentinel { public static void main(String[] args) throws Exception { Thread.sleep(60000); } }' | Set-Content -LiteralPath $taskSource -Encoding ascii
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
$taskChild=Start-Process -FilePath "$env:JAVA_HOME/bin/java.exe" -ArgumentList @($taskSource,'--spring.profiles.active=adoption') -PassThru -WindowStyle Hidden -RedirectStandardOutput "$taskSentinel/stdout.log" -RedirectStandardError "$taskSentinel/stderr.log"
try {
 node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage only=preflight-hides-missing-constraint *> "$taskRoot/child-active.log"
 $taskBlocked=$LASTEXITCODE
 if ($taskBlocked -eq 0 -or -not (Select-String -LiteralPath "$taskRoot/child-active.log" -SimpleMatch 'Runtime Java processes may still be active' -Quiet)) {throw 'Native orphan guard did not reject'}
 if (Test-Path -LiteralPath "$taskRoot/checkout/controle-financeiro-backend/target") {throw 'Maven ran before quiescence'}
} finally {if (!$taskChild.HasExited) {Stop-Process -Id $taskChild.Id; $taskChild.WaitForExit()}}
# Same identity, now quiescent; continue the unstarted proof, then reuse completion.
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/first.log"
if ($LASTEXITCODE -ne 0) {throw 'Quiescent continuation failed'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/resume.log"
if ($LASTEXITCODE -ne 0) {throw 'Valid reuse failed'}
if (-not (Select-String -LiteralPath "$taskRoot/resume.log" -SimpleMatch 'verified completion reused' -Quiet)) {throw 'Completion was not revalidated/reused'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage audit only=preflight-hides-missing-constraint *> "$taskRoot/audit.log"
if ($LASTEXITCODE -ne 0) {throw 'Scoped audit failed'}
[ordered]@{blockedExit=$taskBlocked;nativeChildOutsideRuntimeDetected=$true;stoppedOnlyKnownOwnedPid=$taskChild.Id;noMavenBeforeQuiescence=$true;continuedToCausalCompletion=$true;validCompletionReused=$true;scope='Harmless local Java sentinel, no Spring application or real DB; subsequent proof uses disposable PG17'} | ConvertTo-Json | Set-Content -LiteralPath "$taskRoot/quiescence.json" -Encoding utf8NoBOM
Write-Output 'NATIVE_ORPHAN_GUARD=VERIFIED; CAUSAL_COMPLETION=REUSED'
