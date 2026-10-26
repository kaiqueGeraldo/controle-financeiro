param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference = 'Stop'
$taskAllowed = [IO.Path]::GetFullPath((Join-Path (Get-Location) '../controle-financeiro-runtimes/preparacao-adocao')) + [IO.Path]::DirectorySeparatorChar
$taskRoot = [IO.Path]::GetFullPath($Runtime)
if (!$taskRoot.StartsWith($taskAllowed) -or !(Split-Path -Leaf $taskRoot).StartsWith('revisao-')) { throw 'Runtime novo de revisão exigido' }
$taskOut = Join-Path $taskRoot 'original40-samples'
New-Item -ItemType Directory -Path $taskOut | Out-Null
$taskJcmd = Join-Path (Get-Location) 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1/bin/jcmd.exe'
$taskSeen = @{}
$taskSamples = [System.Collections.Generic.List[object]]::new()
$taskClock = [Diagnostics.Stopwatch]::StartNew()
while ($taskClock.Elapsed.TotalSeconds -lt 600) {
    foreach ($taskProc in (Get-CimInstance Win32_Process -Filter "Name='java.exe'")) {
        if ($taskProc.CommandLine -notmatch 'preparacao-adocao[\\/]p05[\\/]package[\\/]api.jar' -or $taskProc.CommandLine -notmatch 'spring.profiles.active=adoption') { continue }
        foreach ($taskThreshold in @(25,35)) {
            $taskKey = "$($taskProc.ProcessId)-$taskThreshold"
            $taskAge = ([DateTime]::UtcNow - $taskProc.CreationDate.ToUniversalTime()).TotalSeconds
            if ($taskAge -lt $taskThreshold -or $taskSeen.ContainsKey($taskKey)) { continue }
            $taskSeen[$taskKey] = $true
            try {
                $taskProcess = Get-Process -Id $taskProc.ProcessId
                $taskSample = [ordered]@{at=[DateTime]::UtcNow.ToString('o');pid=$taskProc.ProcessId;ageSeconds=$taskAge;cpuSeconds=$taskProcess.TotalProcessorTime.TotalSeconds;workingSetBytes=$taskProcess.WorkingSet64;thresholdSeconds=$taskThreshold}
                & $taskJcmd "$($taskProc.ProcessId)" Thread.print *> (Join-Path $taskOut "$taskKey-threads.txt")
                $taskSample.jcmdExit = $LASTEXITCODE
                $taskSamples.Add($taskSample)
                $taskSamples | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $taskOut 'samples.json') -Encoding utf8
            } catch { $_.Exception.GetType().Name | Add-Content -LiteralPath (Join-Path $taskOut 'observer-errors.txt') }
        }
    }
    $taskLog = Join-Path $taskRoot 'original40.log'
    if ((Test-Path -LiteralPath $taskLog) -and (Select-String -LiteralPath $taskLog -Pattern 'BUILD SUCCESS|BUILD FAILURE' -Quiet)) { break }
    Start-Sleep -Seconds 2
}
Write-Output "samples=$($taskSamples.Count) elapsedSeconds=$($taskClock.Elapsed.TotalSeconds)"
