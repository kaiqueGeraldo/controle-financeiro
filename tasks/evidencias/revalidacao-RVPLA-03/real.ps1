param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop';$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
if(!$taskRoot.StartsWith([IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla03-'))){throw 'New review runtime required'}
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
$taskContainer=(& docker run --detach --rm --pull=never --label cf.preparation.adoption=true --entrypoint sleep postgres:17-alpine 60).Trim()
if($LASTEXITCODE -ne 0 -or $taskContainer -notmatch '^[a-f0-9]{64}$'){throw 'Owned daemon sentinel not created'}
try{
 node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage only=preflight-hides-missing-constraint *> "$taskRoot/daemon-blocked.log"
 $taskBlocked=$LASTEXITCODE
 if($taskBlocked -eq 0 -or !(Select-String -LiteralPath "$taskRoot/daemon-blocked.log" -SimpleMatch 'API containers may still be active' -Quiet)){throw 'Daemon resource not blocked'}
 if(Test-Path -LiteralPath "$taskRoot/counterproofs/v2/preflight-hides-missing-constraint"){throw 'Attempt advanced while daemon resource active'}
 $taskStillRunning=& docker inspect --format '{{.State.Running}}' $taskContainer
 if($LASTEXITCODE -ne 0 -or $taskStillRunning -ne 'true'){throw 'Other logical execution was stopped by guard'}
}finally{
 & docker stop --time 1 $taskContainer > "$taskRoot/daemon-stop.log"
 if($LASTEXITCODE -ne 0){throw 'Owned daemon sentinel stop failed'}
}
& docker inspect $taskContainer *> "$taskRoot/daemon-absent.log"
if($LASTEXITCODE -eq 0){throw 'Owned daemon resource still exists'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-first.log"
if($LASTEXITCODE -ne 0){throw 'Real PG17 causal proof failed; outputs retained'}
$taskCheckpoint=Join-Path $taskRoot 'counterproofs/v2/preflight-hides-missing-constraint/0001/checkpoint.json'
$taskBefore=(Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-resume.log"
if($LASTEXITCODE -ne 0 -or !(Select-String -LiteralPath "$taskRoot/real-resume.log" -SimpleMatch 'verified completion reused' -Quiet)){throw 'Real completion not reused'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage audit only=preflight-hides-missing-constraint *> "$taskRoot/real-audit.log"
if($LASTEXITCODE -ne 0){throw 'Real scoped audit failed'}
if((Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash -ne $taskBefore){throw 'Completion receipt changed during reuse'}
$taskCopy=Join-Path $taskRoot 'other-observer'
$taskSources=@('.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1','tasks/evidencias/preparacao-local-adocao/counterproofs.mjs','tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs','tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.mjs','tasks/evidencias/preparacao-local-adocao/counterproof-observation.mjs')
foreach($taskFile in $taskSources){$taskTarget=Join-Path $taskCopy $taskFile;New-Item -ItemType Directory -Path (Split-Path -Parent $taskTarget) -Force | Out-Null;Copy-Item -LiteralPath $taskFile -Destination $taskTarget}
$taskOther=Join-Path $taskCopy 'tasks/evidencias/preparacao-local-adocao/counterproofs.mjs';[IO.File]::AppendAllText($taskOther,"`n// Independent observer identity perturbation.`n")
node $taskOther $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-other-observer.log"
if($LASTEXITCODE -eq 0 -or !(Select-String -LiteralPath "$taskRoot/real-other-observer.log" -SimpleMatch 'Incompatible checkpoint identity' -Quiet)){throw 'Foreign observer not rejected'}
if((Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash -ne $taskBefore){throw 'Rejected observer changed checkpoint'}
[ordered]@{daemonContainer=$taskContainer;daemonBlockedBeforeAttempt=$true;logicalThirdPartyPreserved=$true;ownSentinelStoppedAndAbsent=$true;realCausalProof=$true;completionReused=$true;checkpointSha256=$taskBefore;receiptUnchanged=$true;otherObserverRejected=$true;scope='One PG17 preflight mutation, not full counterproof/startup gate'}|ConvertTo-Json|Set-Content -LiteralPath "$taskRoot/real-result.json" -Encoding utf8NoBOM
Write-Output 'DAEMON_GUARD=BLOCKED; REAL_PG17=CAUSAL_REUSED; FOREIGN_OBSERVER=REJECTED'
