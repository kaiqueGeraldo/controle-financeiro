param([Parameter(Mandatory=$true)][string]$Runtime,[ValidateSet('inicial','final')][string]$Fase='inicial')
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath($Runtime)
$taskAllowed=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao')+[IO.Path]::DirectorySeparatorChar
if(!$taskRoot.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase) -or !(Split-Path -Leaf $taskRoot).StartsWith('startup-hql-')){throw 'Runtime fora do escopo'}
$taskOutput=Join-Path $taskRoot "ambiente-$Fase.json"
if(Test-Path -LiteralPath $taskOutput){throw 'Recibo existente'}
$taskLineage=@($PID);$taskCursor=$PID
for($i=0;$i -lt 12;$i++){$p=Get-CimInstance Win32_Process -Filter "ProcessId=$taskCursor";if(!$p){break};$taskCursor=[int]$p.ParentProcessId;$taskLineage+=,$taskCursor;if(!$taskCursor){break}}
$taskProcesses=@(Get-CimInstance Win32_Process)
$taskAssociated=@($taskProcesses | Where-Object {$_.ProcessId -notin $taskLineage -and $_.CommandLine -and $_.CommandLine.Replace('/','\').IndexOf($taskRoot.Replace('/','\'),[StringComparison]::OrdinalIgnoreCase) -ge 0} | Select-Object ProcessId,ParentProcessId,Name,CreationDate)
$taskJava=@($taskProcesses | Where-Object {$_.Name -in @('java.exe','javaw.exe')} | Select-Object ProcessId,ParentProcessId,Name,CreationDate)
$taskOS=Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,LastBootUpTime,TotalVisibleMemorySize,FreePhysicalMemory
$taskCPU=@(Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors)
$taskDocker=& docker info --format '{{json .}}' | ConvertFrom-Json
if($LASTEXITCODE -ne 0){throw 'Docker info falhou'}
$taskImage='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'
$taskInspect=(& docker image inspect $taskImage | ConvertFrom-Json)[0]
if($LASTEXITCODE -ne 0 -or $taskInspect.Id -ne $taskImage){throw 'Imagem inesperada'}
$taskContainers=@(& docker ps --format '{{.ID}} {{.Image}} {{.Names}}')
if($LASTEXITCODE -ne 0){throw 'Docker ps falhou'}
$taskPorts=@()
foreach($taskFile in Get-ChildItem -LiteralPath $taskRoot -Filter observation.json -Recurse){$v=Get-Content -LiteralPath $taskFile.FullName -Raw | ConvertFrom-Json;if($v.port -gt 0){$taskPorts+=,$v.port}}
$taskPorts=@($taskPorts | Sort-Object -Unique)
$taskEndpoints=@(Get-NetTCPConnection -ErrorAction Stop | Where-Object {$taskPorts -contains $_.LocalPort -or $taskPorts -contains $_.RemotePort} | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess)
$taskReceipt=[ordered]@{at=[DateTime]::UtcNow.ToString('o');phase=$Fase;runtime=$taskRoot;os=$taskOS;cpu=$taskCPU;docker=@{version=$taskDocker.ServerVersion;cpus=$taskDocker.NCPU;memory=$taskDocker.MemTotal;os=$taskDocker.OperatingSystem};image=@{id=$taskInspect.Id;os=$taskInspect.Os;architecture=$taskInspect.Architecture;user=$taskInspect.Config.User;labels=$taskInspect.Config.Labels};associatedProcesses=$taskAssociated;otherJavaObserved=$taskJava;runningContainers=$taskContainers;ports=$taskPorts;endpoints=$taskEndpoints;readOnly=$true;terminationIssued=$false}
[IO.File]::WriteAllText($taskOutput,($taskReceipt | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
if($taskAssociated.Count -gt 0){throw 'Processos associados presentes, nenhum encerrado por esta auditoria'}
[ordered]@{phase=$Fase;associated=$taskAssociated.Count;java=$taskJava.Count;containers=$taskContainers.Count;endpoints=$taskEndpoints.Count}|ConvertTo-Json -Compress
