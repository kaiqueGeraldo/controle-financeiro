param([Parameter(Mandatory=$true)][string]$Name,[Parameter(Mandatory=$true)][string]$Tests,[switch]$WarmBrowser)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
$out="$PSScriptRoot/$Name"
if(Test-Path $out){throw 'Preserve previous execution'}
New-Item -ItemType Directory $out | Out-Null
$backend="$root/.cf22r/controle-financeiro-backend"
$launcher="$backend/src/test/java/com/controlefinanceiro/api/domain/habit/HabitBrowserIntegrationTest.java"
$before=[IO.File]::ReadAllBytes($launcher)
try {
 if($WarmBrowser){
  $text=[IO.File]::ReadAllText($launcher)
  if(-not $text.Contains('habit/browser.cjs')){throw 'Unexpected launcher'}
  [IO.File]::WriteAllText($launcher,$text.Replace('habit/browser.cjs','habit/warm-browser.cjs'))
 }
 Push-Location $backend
 try {
  $started=Get-Date
  & ./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' "-Dtest=$Tests" '-Duser.timezone=UTC' "-Dcf022.evidence=$out" test *> "$out/maven.log"
  $result=$LASTEXITCODE
  New-Item -ItemType Directory "$out/surefire" | Out-Null
  Get-ChildItem './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/surefire"
  [ordered]@{tests=$Tests;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;warmBrowser=[bool]$WarmBrowser} | ConvertTo-Json | Set-Content "$out/execution.json"
 } finally {Pop-Location}
} finally {
 if($WarmBrowser){[IO.File]::WriteAllBytes($launcher,$before)}
 $restored=(Get-FileHash $launcher).Hash -eq [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($before))
 if(-not $restored){throw 'Launcher restoration mismatch'}
 [ordered]@{restored=$restored;sha256=(Get-FileHash $launcher).Hash} | ConvertTo-Json | Set-Content "$out/launcher-preservation.json"
}
exit $result
