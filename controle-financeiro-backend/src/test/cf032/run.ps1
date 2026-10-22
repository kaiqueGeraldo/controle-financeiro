param([Parameter(Mandatory=$true)][string]$RuntimeRoot,[Parameter(Mandatory=$true)][string]$Evidence,[string]$Tests='FinancialJourneyPostgresE2E',[string]$Grep)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../../..").Path
$runtime=(Resolve-Path $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-032/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Not a CF032 runtime'}
$out=[IO.Path]::GetFullPath($Evidence)
if(Test-Path -LiteralPath $out){throw 'Preserve previous evidence; choose a new run name'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
$env:JAVA_HOME=(Resolve-Path "$repo/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH="$env:JAVA_HOME/bin;$env:PATH"
$env:PLAYWRIGHT_BROWSERS_PATH='0'
$env:CF032_REPO=$repo
$env:CF032_RUNTIME=$runtime
$env:CF032_EVIDENCE=$out
$env:CF032_HEAD=(git -C $repo rev-parse HEAD)
if($Grep){$env:CF032_GREP=$Grep}else{Remove-Item Env:CF032_GREP -ErrorAction SilentlyContinue}
$started=Get-Date
Push-Location "$runtime/backend"
try {
 & ./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dspring.test.context.cache.maxSize=4' "-Dtest=$Tests" test *> "$out/maven.log"
 $result=$LASTEXITCODE
 Get-ChildItem './target/surefire-reports' -File -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
}finally{Pop-Location}
# Surefire XML contains environment/system properties. Keep test results, remove
# properties and credentials instead of publishing an unreviewed process dump.
Get-ChildItem "$out/reports" -Filter '*.xml' | ForEach-Object {
 $doc=[xml](Get-Content -LiteralPath $_.FullName -Raw)
 foreach($p in @($doc.testsuite.properties)){if($p){[void]$doc.testsuite.RemoveChild($p)}}
 $doc.Save($_.FullName)
}
Get-ChildItem $out -Recurse -File | Where-Object Extension -in '.log','.xml','.txt','.json' | ForEach-Object {
 $content=[IO.File]::ReadAllText($_.FullName)
 $safe=[regex]::Replace($content,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED]')
 $safe=[regex]::Replace($safe,'Cf003-[AB]-Senha-2026','[REDACTED]')
 if($safe -cne $content){[IO.File]::WriteAllText($_.FullName,$safe)}
}
[ordered]@{runtime=$runtime;head=(git -C $repo rev-parse HEAD);tests=$Tests;grep=$Grep;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result} | ConvertTo-Json | Set-Content "$out/execution.json"
Get-Content "$out/maven.log" -Tail 30
exit $result
