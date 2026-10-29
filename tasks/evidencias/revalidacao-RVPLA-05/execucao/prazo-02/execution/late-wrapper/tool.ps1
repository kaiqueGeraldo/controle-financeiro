param([Parameter(Mandatory=$true)][string]$Root,[string]$Mode='before',[switch]$Extra)
$ErrorActionPreference='Stop'
function Mark([string]$Name,$Value) {
 $target=[IO.Path]::GetFullPath((Join-Path $Root $Name));$allowed=[IO.Path]::GetFullPath($Root)+[IO.Path]::DirectorySeparatorChar
 if(!$target.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Fixture marker outside root'}
 $tmp=$target+'.tmp';[IO.File]::WriteAllText($tmp,($Value | ConvertTo-Json -Depth 6 -Compress));Move-Item -LiteralPath $tmp -Destination $target
}
if(!$Extra -and (Test-Path -LiteralPath "$Root/wrapper.json")){Write-Output 'SECOND_ATTEMPT_FAILURE_BEFORE_EFFECT';exit 1}
$identity=[ordered]@{pid=$PID;ticks=([Diagnostics.Process]::GetCurrentProcess().StartTime.ToUniversalTime().Ticks.ToString());at=[DateTimeOffset]::UtcNow.ToString('o')}
$tree=@();$cursor=$PID;$owner=[int](Get-Content -LiteralPath "$Root/owner.pid")
for($i=0;$i -lt 8;$i++){ $p=Get-CimInstance Win32_Process -Filter "ProcessId=$cursor"; if(!$p){break};$tree+=@{pid=$cursor;parent=[int]$p.ParentProcessId;name=$p.Name;created=$p.CreationDate.ToUniversalTime().ToString('o')};if($cursor -eq $owner){break};$cursor=[int]$p.ParentProcessId }
$identity.tree=$tree
Mark $(if($Extra){'extra.json'}else{'wrapper.json'}) $identity
if($Mode -eq 'normal'){Write-Output 'NORMAL_TOOL_FAILURE_BEFORE_EFFECT';exit 1}
if($Mode -eq 'partial' -and !$Extra) {
 $child=Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',"$Root/tool.ps1",'-Root',$Root,'-Mode','before','-Extra') -PassThru -WindowStyle Hidden -RedirectStandardOutput "$Root/extra.stdout" -RedirectStandardError "$Root/extra.stderr"
 exit 1
}
if($Mode -ne 'after') {
 $clock=[Diagnostics.Stopwatch]::StartNew()
 while(!(Test-Path -LiteralPath "$Root/release-first") -and $clock.ElapsedMilliseconds -lt 20000){Start-Sleep -Milliseconds 25}
 if(!(Test-Path -LiteralPath "$Root/release-first")){exit 92}
}
$child=Start-Process -FilePath "$env:JAVA_HOME/bin/java.exe" -ArgumentList @('-cp',$env:RVPLA03_CLASSES,'OwnedTree',$Root,$(if($Mode -eq 'after'){'child'}else{'late'})) -PassThru -WindowStyle Hidden -RedirectStandardOutput "$Root/java.stdout" -RedirectStandardError "$Root/java.stderr"
$child.WaitForExit();exit 1
