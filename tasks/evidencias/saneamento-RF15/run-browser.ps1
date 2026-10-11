param([string]$Evidence, [string]$Grep)
$ErrorActionPreference='Stop'
$repoRoot=Resolve-Path "$PSScriptRoot/../../.."
Set-Location $repoRoot
$env:JAVA_HOME=(Get-ChildItem controle-financeiro-backend/target/temurin21 -Directory | Select-Object -First 1 -ExpandProperty FullName)
$env:PATH="$env:JAVA_HOME/bin;$env:PATH"
& ./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15RemediationBrowserTest' "-Dreview.evidence=$Evidence" "-Dreview.grep=$Grep" test *> "$PSScriptRoot/$Evidence.log"
exit $LASTEXITCODE
