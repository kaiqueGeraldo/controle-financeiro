param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$taskRuntime=(Resolve-Path -LiteralPath $Runtime).Path
if (!$taskRuntime.StartsWith([IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-'))) {throw 'New revalidation runtime required'}
$taskRoot=Join-Path $taskRuntime 'orphan'; New-Item -ItemType Directory -Path $taskRoot | Out-Null
$taskBack=Join-Path $taskRoot 'checkout/controle-financeiro-backend'
$taskRelative='controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/migration/LegacyPreflight.java'
$taskSource=Join-Path $taskRoot "checkout/$taskRelative"
New-Item -ItemType Directory -Path (Split-Path -Parent $taskSource) -Force | Out-Null
Copy-Item -LiteralPath $taskRelative -Destination $taskSource
$taskHash=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash.ToLowerInvariant()
[ordered]@{commit='aa068d17aba41855c3f5f5fb5385b6dfd2babc4a';inputs=@([ordered]@{file=$taskRelative;sha256=$taskHash})} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$taskRoot/inputs.json" -Encoding utf8NoBOM
foreach($taskName in @('counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs')) {Copy-Item -LiteralPath "tasks/evidencias/preparacao-local-adocao/$taskName" -Destination "$taskRoot/$taskName"}
$taskJavaSource=@'
import java.nio.file.*;
class LateOwnedOperation {public static void main(String[] args)throws Exception {
 Path root=Path.of(args[0]);Files.writeString(root.resolve("late-java.pid"),Long.toString(ProcessHandle.current().pid()));
 Files.writeString(root.resolve("late-effect.txt"),"OWNED_TOOL_STARTED_JAVA_AFTER_RESUME "+java.time.Instant.now());Thread.sleep(30000);
}}
'@
[IO.File]::WriteAllText("$taskRoot/LateOwnedOperation.java",$taskJavaSource,[Text.UTF8Encoding]::new($false))
$taskTool=@'
param([string]$Root)
$ErrorActionPreference='Stop'
if (Test-Path -LiteralPath "$Root/first-waiting.pid") {Write-Output 'SECOND_ATTEMPT_TOOL_FAILURE before assertion/causal effect';exit 1}
[IO.File]::WriteAllText("$Root/first-waiting.pid",[string]$PID)
$taskClock=[Diagnostics.Stopwatch]::StartNew()
while (!(Test-Path -LiteralPath "$Root/release-first") -and $taskClock.Elapsed.TotalSeconds -lt 20) {Start-Sleep -Milliseconds 50}
if (!(Test-Path -LiteralPath "$Root/release-first")) {exit 92}
$taskLate=Start-Process -FilePath "$env:JAVA_HOME/bin/java.exe" -ArgumentList @("$Root/LateOwnedOperation.java",$Root,'--spring.profiles.active=adoption') -PassThru -WindowStyle Hidden -RedirectStandardOutput "$Root/late-java.stdout" -RedirectStandardError "$Root/late-java.stderr"
$taskLate.WaitForExit(); exit 1
'@
[IO.File]::WriteAllText("$taskRoot/tool.ps1",$taskTool,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText("$taskBack/mvnw.cmd","@echo off`r`npowershell.exe -NoProfile -NonInteractive -File `"$taskRoot/tool.ps1`" -Root `"$taskRoot`"`r`nexit /b %ERRORLEVEL%`r`n",[Text.UTF8Encoding]::new($false))
function Wait-OwnedFile([string]$File) { $taskClock=[Diagnostics.Stopwatch]::StartNew(); while (!(Test-Path -LiteralPath $File) -and $taskClock.Elapsed.TotalSeconds -lt 20) {Start-Sleep -Milliseconds 50}; if(!(Test-Path -LiteralPath $File)){throw "Owned observation missing: $File"} }
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
$taskOwner=$null;$taskWrapper=$null;$taskLateProcess=$null
try {
 $taskOwner=Start-Process -FilePath (Get-Command node).Source -ArgumentList @("$taskRoot/counterproofs.mjs",$taskRoot,$taskImage,'only=preflight-hides-missing-constraint') -PassThru -WindowStyle Hidden -RedirectStandardOutput "$taskRoot/first.stdout" -RedirectStandardError "$taskRoot/first.stderr"
 Wait-OwnedFile "$taskRoot/first-waiting.pid"
 $taskWrapper=Get-Process -Id ([int](Get-Content -LiteralPath "$taskRoot/first-waiting.pid"))
 $taskMutatedHash=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash.ToLowerInvariant()
 if($taskMutatedHash -eq $taskHash){throw 'Mutation did not occur before interruption'}
 Stop-Process -Id $taskOwner.Id; $taskOwner.WaitForExit(); if($taskWrapper.HasExited){throw 'Owned wrapper did not survive parent interruption'}
 node "$taskRoot/counterproofs.mjs" $taskRoot $taskImage resume only=preflight-hides-missing-constraint *> "$taskRoot/resume.log"
 $taskResumeExit=$LASTEXITCODE
 $taskAttempt2=Join-Path $taskRoot 'counterproofs/v2/preflight-hides-missing-constraint/0002/checkpoint.json'
 if(!(Test-Path -LiteralPath $taskAttempt2)){throw 'No second attempt; expected resource hypothesis not confirmed'}
 $taskAfterResume=[DateTimeOffset]::UtcNow.ToString('o')
 $taskWrapper.Refresh();if($taskWrapper.HasExited){throw 'Wrapper no longer active at second attempt'}
 [IO.File]::WriteAllText("$taskRoot/release-first",'release owned delayed tool after resume')
 Wait-OwnedFile "$taskRoot/late-effect.txt"
 $taskLatePid=[int](Get-Content -LiteralPath "$taskRoot/late-java.pid");$taskLateProcess=Get-Process -Id $taskLatePid
 $taskRecord=[ordered]@{hypothesis='Interrupted Node leaves own cmd/PowerShell tool before JVM creation; Java-only guard misses it';ownerPid=$taskOwner.Id;ownerStopped=$true;ownedWrapperPid=$taskWrapper.Id;wrapperAliveDuringSecondAttempt=$true;resumeExit=$taskResumeExit;secondAttemptCreated=$true;afterResumeUtc=$taskAfterResume;lateEffect=(Get-Content -LiteralPath "$taskRoot/late-effect.txt" -Raw);lateJavaPid=$taskLatePid;before=$taskHash;mutated=$taskMutatedHash;afterResume=(Get-FileHash -LiteralPath $taskSource -Algorithm SHA256).Hash.ToLowerInvariant();runnerUnmodified=$true;databaseUsed=$false;scope='Windows Node interruption during spawnSync Maven/tool boundary; harmless owned fixture, not universal cancellation'}
 if($taskRecord.afterResume -ne $taskHash){throw 'Input not restored'}
 $taskRecord | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$taskRoot/result.json" -Encoding utf8NoBOM
} finally {
 if($taskLateProcess){$taskLateProcess.Refresh();if(!$taskLateProcess.HasExited){Stop-Process -Id $taskLateProcess.Id;$taskLateProcess.WaitForExit()}}
 if($taskWrapper){if(!$taskWrapper.WaitForExit(5000)){Stop-Process -Id $taskWrapper.Id;$taskWrapper.WaitForExit()}}
 if($taskOwner){$taskOwner.Refresh();if(!$taskOwner.HasExited){Stop-Process -Id $taskOwner.Id;$taskOwner.WaitForExit()}}
}
if($taskLateProcess -and !$taskLateProcess.HasExited){throw 'Owned helper cleanup incomplete'}
Write-Output 'OWNED_DELAYED_TOOL_NOT_QUIESCENT: second attempt and late Java observed; known owned PIDs stopped.'
