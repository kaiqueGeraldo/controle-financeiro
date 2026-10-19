param(
 [Parameter(Mandatory=$true)][string]$Name,
 [string]$Tests='DraftValidatorTest,OnboardingIntegrationTest,OnboardingMigrationTest',
 [string]$Backend,
 [string]$Zone='UTC'
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
if(-not $Backend){$Backend="$root/controle-financeiro-backend"}
$out="$root/tasks/evidencias/revisao-CF-029/$Name"
if(Test-Path -LiteralPath $out){throw 'Preserve existing execution'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$started=Get-Date
Push-Location $Backend
try {
 & ./mvnw.cmd --batch-mode "-Dtest=$Tests" "-Duser.timezone=$Zone" "-Drv24.evidence=$out/deletion" test *> "$out/maven.log"
 $result=$LASTEXITCODE
 Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
} finally {Pop-Location}
Get-ChildItem $out -Recurse -File | ForEach-Object {
 $content=[IO.File]::ReadAllText($_.FullName)
 $redacted=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_SYNTHETIC_JWT]')
 if($content -cne $redacted){[IO.File]::WriteAllText($_.FullName,$redacted)}
}
[ordered]@{candidate='5bac46ee65cfbf4dade0705b7a430a15731be832';tests=$Tests;backend=$Backend;timezone=$Zone;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result} | ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 15
exit $result
