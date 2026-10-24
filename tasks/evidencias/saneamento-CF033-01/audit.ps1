$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$runtime=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-033/saneamento-20261024-01")
$initial=Get-Content "$PSScriptRoot/initial-preservation.json" -Raw | ConvertFrom-Json
$proofs=foreach($entry in $initial.files){
 $hash=(Get-FileHash -LiteralPath "$repo/$($entry.path)" -Algorithm SHA256).Hash
 if($hash -ne $entry.sha256){throw "Original modified: $($entry.path)"}
 [ordered]@{path=$entry.path;before=$entry.sha256;after=$hash;equal=$true}
}
$sources=foreach($entry in Get-ChildItem "$repo/controle-financeiro-backend/src" -Recurse -File){
 $relative=[IO.Path]::GetRelativePath("$repo/controle-financeiro-backend",$entry.FullName)
 $hash=(Get-FileHash -LiteralPath $entry.FullName -Algorithm SHA256).Hash
 $copy=(Get-FileHash -LiteralPath "$runtime/backend/$relative" -Algorithm SHA256).Hash
 if($hash -ne $copy){throw "Runtime/workspace source mismatch: $relative"}
 [ordered]@{path=$relative;sha256=$hash}
}
$certification='tasks/evidencias/revalidacao-CF-032/CertificationProbeTest.java'
$certHash=(Get-FileHash -LiteralPath "$repo/$certification" -Algorithm SHA256).Hash
if($certHash -ne (Get-FileHash -LiteralPath "$runtime/backend/src/test/java/com/controlefinanceiro/api/domain/onboarding/CertificationProbeTest.java" -Algorithm SHA256).Hash){throw 'Historical certification probe changed'}
foreach($entry in $initial.runtimes){if(-not (Test-Path -LiteralPath "$repo/../controle-financeiro-runtimes/CF-033/$($entry.Name)")){throw 'Historical runtime missing'}}
$results=foreach($phase in Get-ChildItem $PSScriptRoot -Directory){
 $execution="$($phase.FullName)/execution.json"
 if(-not (Test-Path -LiteralPath $execution)){continue}
 $run=Get-Content -LiteralPath $execution -Raw | ConvertFrom-Json
 $tests=0;$failures=0;$errors=0;$skips=0
 foreach($report in Get-ChildItem "$($phase.FullName)/reports" -Filter '*.xml' -File){
  $xml=[xml](Get-Content -LiteralPath $report.FullName -Raw)
  $tests+=[int]$xml.testsuite.tests;$failures+=[int]$xml.testsuite.failures
  $errors+=[int]$xml.testsuite.errors;$skips+=[int]$xml.testsuite.skipped
 }
 [ordered]@{phase=$phase.Name;tests=$tests;failures=$failures;errors=$errors;skips=$skips;exitCode=$run.exitCode;selection=$run.tests}
}
$results | ConvertTo-Json -Depth 5 | Set-Content "$PSScriptRoot/results.json"
$sources | ConvertTo-Json -Depth 5 | Set-Content "$PSScriptRoot/final-sources.json"
[ordered]@{head=(git -C $repo rev-parse HEAD);branch=(git -C $repo branch --show-current);proofs=@($proofs);certificationProbe=@{path=$certification;sha256=$certHash};sourceCount=@($sources).Count;runtime=$runtime;historicalRuntimes='All initial directories remain; runners only target this new runtime';checkedAt=(Get-Date).ToString('o')} | ConvertTo-Json -Depth 6 | Set-Content "$PSScriptRoot/final-preservation.json"
$parseErrors=$null;$tokens=$null
[void][System.Management.Automation.Language.Parser]::ParseFile("$PSScriptRoot/run.ps1",[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count){throw 'Runner parser errors'}
git -C $repo diff --exit-code -- tasks/evidencias/CF-033 controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/onboarding/Cf033ProgressIndependenceProbeTest.java controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/service/Cf024ConcurrencyCacheIntegrationTest.java controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/onboarding/OnboardingReviewConcurrencyTest.java
if($LASTEXITCODE -ne 0){throw 'Original proof/evidence tracked diff'}
$results | Select-Object phase,tests,failures,errors,skips,exitCode | Format-Table
Write-Output "Preserved $(@($proofs).Count) originals; $(@($sources).Count) runtime sources match workspace; certification probe intact."
