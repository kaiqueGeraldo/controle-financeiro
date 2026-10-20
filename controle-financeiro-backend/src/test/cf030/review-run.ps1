param(
 [Parameter(Mandatory=$true)][string]$Name,
 [Parameter(Mandatory=$true)][string]$Tests,
 [string]$Backend,
 [string]$Zone='UTC'
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
if(-not $Backend){$Backend="$root/controle-financeiro-backend"}
$Backend=(Resolve-Path $Backend).Path
$out="$root/tasks/evidencias/revisao-CF-030/$Name"
if(Test-Path -LiteralPath $out){throw 'Execution exists; preserve evidence'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$started=Get-Date
Push-Location $Backend
try {
 & ./mvnw.cmd --batch-mode '-Dspring.test.context.cache.maxSize=8' "-Duser.timezone=$Zone" "-Dtest=$Tests" test *> "$out/maven.log"
 $result=$LASTEXITCODE
 Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
}finally{Pop-Location}
Get-ChildItem $out -Recurse -File | ForEach-Object {
 $content=[IO.File]::ReadAllText($_.FullName)
 $redacted=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_SYNTHETIC_JWT]')
 if($content -cne $redacted){[IO.File]::WriteAllText($_.FullName,$redacted)}
}
[ordered]@{tests=$Tests;backend=$Backend;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;zone=$Zone;candidate='89760e64a73b6268d8cf34745cf41d6b00dcd781'} | ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 24
exit $result
