param([Parameter(Mandatory=$true)][string]$Name,[Parameter(Mandatory=$true)][string]$Tests,[switch]$Candidate)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
$out="$PSScriptRoot/$Name"
if(Test-Path $out){throw 'Preserve previous execution'}
New-Item -ItemType Directory $out | Out-Null
$runtime=if($Candidate){"$root/.cf22s"}else{"$PSScriptRoot/runtime"}
Push-Location "$runtime/controle-financeiro-backend"
try {
 $started=Get-Date
 & ./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' "-Dtest=$Tests" '-Duser.timezone=UTC' "-Dcf022.evidence=$out" test *> "$out/maven.log"
 $result=$LASTEXITCODE
 New-Item -ItemType Directory "$out/surefire" | Out-Null
 Get-ChildItem -LiteralPath './target/surefire-reports' -File | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/surefire"
 [ordered]@{tests=$Tests;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;runtime=$runtime} | ConvertTo-Json | Set-Content "$out/execution.json"
 exit $result
} finally {Pop-Location}
