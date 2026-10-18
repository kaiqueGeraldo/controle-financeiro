$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
$env:JAVA_HOME=(Resolve-Path "$root/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH=$env:JAVA_HOME+'/bin;'+$env:PATH
if(Test-Path "$PSScriptRoot/scheduler.log"){throw 'Preserve prior run'}
Push-Location "$PSScriptRoot/runtime/controle-financeiro-backend"
try {
 & ./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IndependentFixtureProbeTest#freshResidualIsolated' '-Duser.timezone=UTC' "-Dcf022.evidence=$PSScriptRoot/scheduler" test *> "$PSScriptRoot/scheduler.log"
 exit $LASTEXITCODE
} finally {Pop-Location}
