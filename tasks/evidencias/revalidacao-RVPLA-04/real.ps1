param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop';$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
if(!$taskRoot.StartsWith([IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla04-'))){throw 'New review runtime required'}
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage only=preflight-hides-missing-constraint *> "$taskRoot/real-first.log"
if($LASTEXITCODE -ne 0){throw 'Real PG17 proof failed; retain original output'}
$taskCheckpoint=Join-Path $taskRoot 'counterproofs/v2/preflight-hides-missing-constraint/0001/checkpoint.json';$taskBefore=(Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/real-resume.log"
if($LASTEXITCODE -ne 0 -or !(Select-String -LiteralPath "$taskRoot/real-resume.log" -SimpleMatch 'verified completion reused' -Quiet)){throw 'Real completion reuse failed'}
node tasks/evidencias/preparacao-local-adocao/counterproofs.mjs $taskRoot $taskImage audit only=preflight-hides-missing-constraint *> "$taskRoot/real-audit.log"
if($LASTEXITCODE -ne 0){throw 'Scoped audit failed'}
if((Get-FileHash -LiteralPath $taskCheckpoint -Algorithm SHA256).Hash -ne $taskBefore){throw 'Checkpoint changed during reuse'}
node "$taskRoot/tools/tasks/evidencias/saneamento-RVPLA-04/identity.mjs" "$taskRoot/identity" $taskRoot *> "$taskRoot/real-identity.log"
if($LASTEXITCODE -ne 0){throw 'Observer identity control failed'}
[ordered]@{causalPg17Proof=$true;resumeReused=$true;auditPassed=$true;checkpointSha256=$taskBefore;receiptUnchanged=$true;otherObserverRejected=$true;scope='One scoped preflight; no startup/full counterproof gate'}|ConvertTo-Json|Set-Content -LiteralPath "$taskRoot/real-result.json" -Encoding utf8NoBOM
Write-Output 'PG17_CAUSAL_PROOF_REUSED; AUDIT_AND_IDENTITY_PASS'
