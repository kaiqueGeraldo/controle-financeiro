param(
 [Parameter(Mandatory=$true)][string]$Phase,
 [string]$Tests='Cf033ProgressIndependenceProbeTest',
 [switch]$Sync,
 [ValidateSet('none','progress','capacity')][string]$Mutation='none',
 [switch]$Package
)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$runtime=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-033/saneamento-20261024-01")
$backend="$runtime/backend"
if(-not (Test-Path -LiteralPath "$runtime/manifest.json")){throw 'Prepare dedicated runtime first'}
if($Phase -notmatch '^[a-z0-9-]+$'){throw 'Invalid evidence phase'}
$out="$PSScriptRoot/$Phase"
if(Test-Path -LiteralPath $out){throw 'Never overwrite evidence'}
New-Item -ItemType Directory -Path "$out/reports" | Out-Null
if($Sync){Copy-Item -Path "$repo/controle-financeiro-backend/src/*" -Destination "$backend/src" -Recurse -Force}
# Reuse the five independent certification probes byte for byte, in this runtime.
Copy-Item -LiteralPath "$repo/tasks/evidencias/revalidacao-CF-032/CertificationProbeTest.java" -Destination "$backend/src/test/java/com/controlefinanceiro/api/domain/onboarding/CertificationProbeTest.java"
$original=@{}
$manifest=Get-ChildItem "$backend/src" -Recurse -File | ForEach-Object {
 [ordered]@{path=[IO.Path]::GetRelativePath($backend,$_.FullName);sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}
}
$manifest | ConvertTo-Json | Set-Content "$out/source-before.json"
$file=$null
if($Mutation -ne 'none'){
 $name=if($Mutation -eq 'progress'){'InvestmentService'}else{'GoalService'}
 $file="$backend/src/main/java/com/controlefinanceiro/api/service/$name.java"
 $original[$file]=[IO.File]::ReadAllBytes($file)
 $source=[IO.File]::ReadAllText($file)
 if($Mutation -eq 'progress'){
  $old='if(data.type()==InvestTransType.BUY)inventoryGuard.capacity(user.getId());'
  $new='if(data.type()==InvestTransType.BUY)inventoryGuard.snapshot(user.getId());'
 }else{
  $old='if(data.amount()!=null && data.amount().signum()>0)inventoryGuard.capacity(user.getId());'+[Environment]::NewLine+'        else inventoryGuard.writer(user.getId());'
  # Match either checkout line-ending convention without changing assertions.
  $match=[regex]::Match($source,'if\(data.amount\(\)!=null && data.amount\(\).signum\(\)>0\)inventoryGuard.capacity\(user.getId\(\)\);\s*else inventoryGuard.writer\(user.getId\(\)\);')
  if(-not $match.Success){throw 'Capacity mutation anchor missing'}
  $old=$match.Value
  $new='/* MUTATION: reservation writer omits the entire guard protocol */'
 }
 if(($source.Split($old).Length-1) -ne 1){throw 'Mutation anchor must be unique'}
 [IO.File]::WriteAllText($file,$source.Replace($old,$new))
 @('--- original', '+++ mutation', "- $old", "+ $new") | Set-Content "$out/mutation.diff"
}
$env:JAVA_HOME=(Resolve-Path "$repo/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1").Path
$env:PATH="$env:JAVA_HOME/bin;$env:PATH"
$env:CF032_EVIDENCE=$out
$env:CF032_HEAD=(git -C $repo rev-parse HEAD)
$started=Get-Date
$result=-1
try{
 Push-Location $backend
 try{
  if($Package){& ./mvnw.cmd --batch-mode '-DskipTests' verify *> "$out/maven.log"}
  else{& ./mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dspring.test.context.cache.maxSize=4' "-Dtest=$Tests" test *> "$out/maven.log"}
  $result=$LASTEXITCODE
  Get-ChildItem "$backend/target/surefire-reports" -File -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -ge $started} | Copy-Item -Destination "$out/reports"
 }finally{Pop-Location}
}finally{
 foreach($p in $original.Keys){[IO.File]::WriteAllBytes($p,$original[$p])}
 $restored=foreach($entry in $manifest){
  $after=(Get-FileHash -LiteralPath "$backend/$($entry.path)" -Algorithm SHA256).Hash
  if($after -ne $entry.sha256){throw "Restoration mismatch: $($entry.path)"}
 }
 [ordered]@{runtime=$runtime;head=(git -C $repo rev-parse HEAD);tests=$Tests;mutation=$Mutation;package=[bool]$Package;started=$started.ToString('o');finished=(Get-Date).ToString('o');exitCode=$result;restoredFiles=@($manifest).Count;restoration='All source SHA256 match before'} | ConvertTo-Json | Set-Content "$out/execution.json"
}
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
Get-Content "$out/maven.log" -Tail 26
exit $result
