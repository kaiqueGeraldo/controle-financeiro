param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$run=[IO.Path]::GetFullPath($Runtime)
$allowed=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../../controle-financeiro-runtimes/preparacao-adocao/tcp-nativo-'))
if (!$run.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)) { throw 'Runtime fora do escopo' }
$apiJar=[IO.Path]::GetFullPath((Join-Path $run '../p05/package/api.jar'))
$processes=@(Get-CimInstance Win32_Process -ErrorAction Stop)
$associated=@($processes | Where-Object {
    $_.ProcessId -ne $PID -and $_.CommandLine -and
    ($_.CommandLine.Contains($run) -or $_.CommandLine.Contains($apiJar) -or
     $_.CommandLine.Contains('TcpNativeDiagnosticTest$Listener') -or $_.CommandLine.Contains('TcpObserver.ps1'))
} | Select-Object ProcessId,ParentProcessId,CreationDate,Name,CommandLine)
$ports=@(Get-ChildItem -LiteralPath $run -Filter '*.json' | ForEach-Object {
    if ($_.Name -like 'application-pg*.json') {
        $entries=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
        $entries | Where-Object event -eq ready | ForEach-Object port
    } elseif ($_.Name -like 'original-window*.json' -or $_.Name -like 'corrigido-window*.json' -or $_.Name -like 'abrupt-*.json' -or $_.Name -like 'synthetic-*.json') {
        $value=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
        $value | ForEach-Object port
    }
} | Where-Object {$_ -gt 0} | Sort-Object -Unique)
$endpoints=@(Get-NetTCPConnection -ErrorAction Stop | Where-Object {$ports -contains $_.LocalPort -or $ports -contains $_.RemotePort} |
    Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess)
$containers=@(& docker ps --format '{{.ID}} {{.Image}} {{.Names}}')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao inspecionar Docker local' }
$knownAlien=$processes | Where-Object ProcessId -eq 20288 | Select-Object ProcessId,CreationDate,Name
$record=@{at=[DateTime]::UtcNow.ToString('o');runtime=$run;associatedProcesses=$associated;observedPorts=$ports;endpoints=$endpoints;runningContainers=$containers;preexistingJava=$knownAlien;readOnly=$true}
$destination=Join-Path $run 'recursos-finais.json'
if(Test-Path -LiteralPath $destination){throw 'Recibo final ja existe'}
$record | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $destination -Encoding utf8
if($associated.Count -gt 0){throw 'Processos associados ainda ativos; nenhum encerrado pelo auditor'}
$record | Select-Object at,@{n='associated';e={$_.associatedProcesses.Count}},@{n='endpoints';e={$_.endpoints.Count}},@{n='containers';e={$_.runningContainers.Count}}
