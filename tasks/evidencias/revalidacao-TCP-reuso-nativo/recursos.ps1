param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$taskRun=[IO.Path]::GetFullPath($Runtime)
$taskAllowed=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-tcp-')
if(!$taskRun.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Runtime fora do escopo'}
$taskLineage=@($PID);$taskCursor=$PID
for($i=0;$i -lt 12;$i++){$p=Get-CimInstance Win32_Process -Filter "ProcessId=$taskCursor";if(!$p){break};$taskCursor=[int]$p.ParentProcessId;$taskLineage+=,$taskCursor;if(!$taskCursor){break}}
$taskAll=@(Get-CimInstance Win32_Process -ErrorAction Stop)
$taskAssociated=@($taskAll | Where-Object {$_.ProcessId -notin $taskLineage -and $_.CommandLine -and $_.CommandLine.Replace('/','\').IndexOf($taskRun.Replace('/','\'),[StringComparison]::OrdinalIgnoreCase) -ge 0} | Select-Object ProcessId,ParentProcessId,Name,CreationDate)
$taskPorts=@()
foreach($f in Get-ChildItem -LiteralPath $taskRun -Filter '*.json'){
 if($f.Name -like '*window-pg*.json' -or $f.Name -like 'synthetic-*.json' -or $f.Name -like 'abrupt-*.json'){$v=Get-Content -Raw -LiteralPath $f.FullName | ConvertFrom-Json;$taskPorts+=@($v | ForEach-Object port)}
 if($f.Name -eq 'review-cases.json'){$v=Get-Content -Raw -LiteralPath $f.FullName | ConvertFrom-Json;$taskPorts+=@($v | Where-Object phase -eq call | ForEach-Object {$_.value.port})}
}
$taskPorts=@($taskPorts | Where-Object {$_ -gt 0} | Sort-Object -Unique)
$taskRows=@(Get-NetTCPConnection -ErrorAction Stop | Where-Object {$taskPorts -contains $_.LocalPort -or $taskPorts -contains $_.RemotePort} | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess)
$taskContainers=@(& docker ps --format '{{.ID}} {{.Image}} {{.Names}}');if($LASTEXITCODE -ne 0){throw 'Inspeção Docker falhou'}
$taskPriorJava=@($taskAll | Where-Object {$_.Name -in @('java.exe','javaw.exe')} | Select-Object ProcessId,CreationDate,Name)
$taskResult=[ordered]@{at=[DateTime]::UtcNow.ToString('o');runtime=$taskRun;associatedProcesses=$taskAssociated;ports=$taskPorts;endpoints=$taskRows;listeners=@($taskRows | Where-Object State -eq Listen);runningContainers=$taskContainers;otherJavaObserved=$taskPriorJava;readOnly=$true;terminationIssued=$false}
$taskDestination=Join-Path $taskRun 'recursos-finais.json';if(Test-Path -LiteralPath $taskDestination){throw 'Recibo existente'}
[IO.File]::WriteAllText($taskDestination,($taskResult | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
if($taskAssociated.Count -gt 0){throw 'Recursos associados ainda ativos; nenhum processo encerrado'}
[ordered]@{associated=$taskAssociated.Count;endpoints=$taskRows.Count;listeners=$taskResult.listeners.Count;containers=$taskContainers.Count;readOnly=$true}|ConvertTo-Json -Compress
