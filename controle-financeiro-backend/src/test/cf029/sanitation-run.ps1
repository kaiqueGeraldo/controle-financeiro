param(
 [Parameter(Mandatory=$true)][string]$Name,
 [Parameter(Mandatory=$true)][string]$Tests,
 [string]$Backend
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
if(-not $Backend){$Backend="$root/controle-financeiro-backend"}
$out="$root/tasks/evidencias/saneamento-CF-029-RC029-01/$Name"
if(Test-Path -LiteralPath $out){throw 'Preserve existing execution'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$started=Get-Date
$command='./mvnw.cmd --batch-mode -Dtest='+$Tests+' -Duser.timezone=America/Sao_Paulo test'
Push-Location $Backend
try {
 & ./mvnw.cmd --batch-mode "-Dtest=$Tests" '-Duser.timezone=America/Sao_Paulo' test *> "$out/maven.log"
 $result=$LASTEXITCODE
 Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
} finally {Pop-Location}
Get-ChildItem $out -Recurse -File | ForEach-Object {
 $content=[IO.File]::ReadAllText($_.FullName)
 $redacted=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_SYNTHETIC_JWT]')
 if($content -cne $redacted){[IO.File]::WriteAllText($_.FullName,$redacted)}
}
[ordered]@{base=(git -C $root rev-parse HEAD);command=$command;tests=$Tests;backend=$Backend;timezone='America/Sao_Paulo';started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result} | ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 17
exit $result
