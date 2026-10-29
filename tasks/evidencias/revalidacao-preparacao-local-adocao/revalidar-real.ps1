param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop';$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
if(!$taskRoot.StartsWith([IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-'))){throw 'New runtime required'}
$taskHelper=Join-Path $taskRoot 'active-helper';New-Item -ItemType Directory -Path $taskHelper | Out-Null
[IO.File]::WriteAllText("$taskHelper/KnownHelper.java",'class KnownHelper {public static void main(String[]args)throws Exception{Thread.sleep(60000);}}',[Text.UTF8Encoding]::new($false))
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
$taskPid=Start-Process -FilePath "$env:JAVA_HOME/bin/java.exe" -ArgumentList @("$taskHelper/KnownHelper.java",'--spring.profiles.active=adoption') -PassThru -WindowStyle Hidden -RedirectStandardOutput "$taskHelper/stdout.log" -RedirectStandardError "$taskHelper/stderr.log"
try {
 node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage only=preflight-hides-missing-constraint *> "$taskRoot/real-active.log"
 $taskBlocked=$LASTEXITCODE
 if($taskBlocked -eq 0 -or !(Select-String -LiteralPath "$taskRoot/real-active.log" -SimpleMatch 'Runtime Java processes may still be active' -Quiet)){throw 'Active Java guard not observed'}
 if(Test-Path -LiteralPath "$taskRoot/counterproofs/v2/preflight-hides-missing-constraint"){throw 'Attempt advanced with active Java'}
}finally{if(!$taskPid.HasExited){Stop-Process -Id $taskPid.Id;$taskPid.WaitForExit()}}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-first.log"
if($LASTEXITCODE -ne 0){throw 'Real causal preflight proof failed; output retained'}
$taskCheckpoint=Join-Path $taskRoot 'counterproofs/v2/preflight-hides-missing-constraint/0001/checkpoint.json'
$taskBefore=(Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-resume.log"
if($LASTEXITCODE -ne 0 -or !(Select-String -LiteralPath "$taskRoot/real-resume.log" -SimpleMatch 'verified completion reused' -Quiet)){throw 'Real causal proof not reused'}
if((Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash -ne $taskBefore){throw 'Completed receipt rewritten during reuse'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage audit only=preflight-hides-missing-constraint *> "$taskRoot/real-audit.log"
if($LASTEXITCODE -ne 0){throw 'Scoped audit failed'}
$taskCopy=Join-Path $taskRoot 'observer-other';New-Item -ItemType Directory -Path $taskCopy | Out-Null
foreach($taskFile in @('counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs')){Copy-Item -LiteralPath "tasks/evidencias/preparacao-local-adocao/$taskFile" -Destination "$taskCopy/$taskFile"}
[IO.File]::AppendAllText("$taskCopy/counterproofs.mjs","`n// Independent identity perturbation; no behavior change.`n")
node "$taskCopy/counterproofs.mjs" $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-other-observer.log"
if($LASTEXITCODE -eq 0 -or !(Select-String -LiteralPath "$taskRoot/real-other-observer.log" -SimpleMatch 'Incompatible checkpoint identity' -Quiet)){throw 'Other observer accepted'}
if((Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash -ne $taskBefore){throw 'Incompatible observer changed receipt'}
[ordered]@{activeJavaBlockedBeforeAttempt=$true;knownPidStopped=$taskPid.Id;realCausalProofCompleted=$true;validCompletionReused=$true;completionReceiptSha256=$taskBefore;receiptUnchanged=$true;otherObserverRejected=$true;scope='One real PG17 preflight mutation. No full counterproof/startup gate.'} | ConvertTo-Json | Set-Content -LiteralPath "$taskRoot/real-result.json" -Encoding utf8NoBOM
Write-Output 'REAL_PG17_CAUSAL_PROOF=REUSED; ACTIVE_JAVA=BLOCKED; OTHER_OBSERVER=REJECTED'
