param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path -LiteralPath $Runtime).Path
$taskAllowed=[IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')
if (!$taskRoot.StartsWith($taskAllowed,[StringComparison]::OrdinalIgnoreCase)) {throw 'Sanitation runtime required'}
$taskAgent=Join-Path $taskRoot 'agent'
New-Item -ItemType Directory -Path $taskAgent | Out-Null
$taskBuddy='C:/Users/Aluga.com/.m2/repository/net/bytebuddy/byte-buddy/1.17.8/byte-buddy-1.17.8.jar'
Copy-Item -LiteralPath $taskBuddy -Destination "$taskAgent/byte-buddy.jar"
New-Item -ItemType Directory -Path "$taskAgent/classes" | Out-Null
& "$env:JAVA_HOME/bin/javac.exe" -cp $taskBuddy -d "$taskAgent/classes" tasks/evidencias/saneamento-preparacao-local-adocao/BootAgent.java
if ($LASTEXITCODE -ne 0) {throw 'Agent compilation failed'}
"Premain-Class: diagnostic.BootAgent`nClass-Path: byte-buddy.jar`n`n" | Set-Content -LiteralPath "$taskAgent/manifest.mf" -Encoding ascii
& "$env:JAVA_HOME/bin/jar.exe" --create --file "$taskAgent/boot-agent.jar" --manifest "$taskAgent/manifest.mf" -C "$taskAgent/classes" .
if ($LASTEXITCODE -ne 0) {throw 'Agent packaging failed'}
Copy-Item -LiteralPath 'tasks/evidencias/saneamento-preparacao-local-adocao/StartupTimelineTest.java' -Destination "$taskRoot/checkout/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/StartupTimelineTest.java"
Get-FileHash -LiteralPath "$taskAgent/boot-agent.jar","$taskAgent/byte-buddy.jar" -Algorithm SHA256 | ConvertTo-Json | Set-Content -LiteralPath "$taskRoot/agent-hashes.json" -Encoding utf8NoBOM
