param(
    [Parameter(Mandatory=$true)][string]$Name,
    [string]$Tests='DraftValidatorTest,OnboardingIntegrationTest,OnboardingMigrationTest',
    [string]$Backend,
    [string]$Zone='UTC',
    [switch]$Verify
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
if(-not $Backend){$Backend="$root/controle-financeiro-backend"}
$Backend=(Resolve-Path $Backend).Path
$out="$root/tasks/evidencias/CF-029/$Name"
if(Test-Path -LiteralPath $out){throw 'Execution name already exists; preserve evidence'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$started=Get-Date
Push-Location $Backend
try {
    $goal=if($Verify){'verify'}else{'test'}
    & ./mvnw.cmd --batch-mode "-Dtest=$Tests" "-Duser.timezone=$Zone" "-Drv24.evidence=$out/deletion" $goal *> "$out/maven.log"
    $result=$LASTEXITCODE
    Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
} finally {Pop-Location}
# Test failures may make MockMvc print synthetic authorization headers. Keep failures,
# redact only the token, never values/assertions/stack traces used by the oracle.
Get-ChildItem $out -Recurse -File | ForEach-Object {
    $content=[IO.File]::ReadAllText($_.FullName)
    $redacted=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_SYNTHETIC_JWT]')
    if($content -cne $redacted){[IO.File]::WriteAllText($_.FullName,$redacted)}
}
[ordered]@{tests=$Tests;backend=$Backend;timezone=$Zone;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;goal=$goal} |
    ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 20
exit $result
