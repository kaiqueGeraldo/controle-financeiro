param([Parameter(Mandatory=$true)][string]$Name,[string]$Tests='OnboardingApplicationTest', [string]$Backend, [switch]$Verify)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
if(-not $Backend){$Backend="$root/controle-financeiro-backend"}
$Backend=(Resolve-Path $Backend).Path
$out="$root/tasks/evidencias/revalidacao-CF-030-RC030/$Name"
if(Test-Path -LiteralPath $out){throw 'Execution already exists; preserve evidence'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$started=Get-Date
Push-Location $Backend
try {
 $goal=if($Verify){'verify'}else{'test'}
 # Each cached Spring context owns a Hikari pool. Bound the cache rather than
 # increasing PostgreSQL connections or weakening concurrent assertions.
 & ./mvnw.cmd --batch-mode '-Dspring.test.context.cache.maxSize=8' "-Dtest=$Tests" "-Drv24.evidence=$out/deletion" $goal *> "$out/maven.log"
 $result=$LASTEXITCODE
 Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
}finally{Pop-Location}
Get-ChildItem $out -Recurse -File | ForEach-Object {
 $content=[IO.File]::ReadAllText($_.FullName)
 $redacted=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_SYNTHETIC_JWT]')
 if($content -cne $redacted){[IO.File]::WriteAllText($_.FullName,$redacted)}
}
[ordered]@{tests=$Tests;backend=$Backend;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;goal=$goal} | ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 28
exit $result
