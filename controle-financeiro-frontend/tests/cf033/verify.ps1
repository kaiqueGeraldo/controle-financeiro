param([Parameter(Mandatory=$true)][string]$Evidence,[Parameter(Mandatory=$true)][string[]]$RuntimeRoots)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$out=[IO.Path]::GetFullPath($Evidence)
$initial=Get-Content -LiteralPath "$out/product-initial.json" -Raw | ConvertFrom-Json
$results=@()
foreach($entry in $initial){
 $current=(Get-FileHash -LiteralPath (Join-Path $repo $entry.path) -Algorithm SHA256).Hash
 $runtimeChecks=@(foreach($root in $RuntimeRoots){
  $runtime=(Resolve-Path -LiteralPath $root).Path
  $relative=$entry.path.Replace('controle-financeiro-backend/','backend/').Replace('controle-financeiro-frontend/','frontend/')
  $hash=(Get-FileHash -LiteralPath (Join-Path $runtime $relative) -Algorithm SHA256).Hash
  [ordered]@{runtime=$runtime;sha256=$hash;equal=$hash -eq $entry.sha256}
 })
 $results+=[ordered]@{path=$entry.path;initial=$entry.sha256;final=$current;equal=$current -eq $entry.sha256;copies=$runtimeChecks}
}
$results | ConvertTo-Json -Depth 7 | Set-Content "$out/product-final.json"
$bad=@($results | Where-Object {-not $_.equal -or @($_.copies | Where-Object {-not $_.equal}).Count -gt 0})
if($bad.Count -gt 0){throw 'Product source mismatch; inspect product-final.json'}
$proofs=Get-Content -LiteralPath "$repo/tasks/evidencias/revalidacao-CF-032/proof-hashes.json" -Raw | ConvertFrom-Json
$initialProofs=Get-Content -LiteralPath "$out/historical-proofs.json" -Raw | ConvertFrom-Json
$historic=@(foreach($proof in $proofs){
 $hash=(Get-FileHash -LiteralPath "$repo/$($proof.path)" -Algorithm SHA256).Hash
 # Git's existing autocrlf=true rewrote checkout EOLs during the authorized FF.
 # Require both raw stability since this review's initial snapshot and exact
 # equality with the accepted hash after ONLY CRLF->LF normalization. Never edit proofs.
 $initialHash=($initialProofs | Where-Object path -eq $proof.path).current
 $lf=[IO.File]::ReadAllText("$repo/$($proof.path)").Replace("`r`n","`n")
 $normalized=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($lf)))
 [ordered]@{path=$proof.path;accepted=$proof.current;initialRaw=$initialHash;current=$hash;rawStable=$hash -eq $initialHash;lf=$normalized;lfMatchesAccepted=$normalized -eq $proof.current;equal=$hash -eq $initialHash -and $normalized -eq $proof.current}
})
$historic | ConvertTo-Json | Set-Content "$out/historical-proofs-final.json"
if(@($historic | Where-Object {-not $_.equal}).Count){throw 'Historical proof changed'}
$reports=@(Get-ChildItem -LiteralPath $out -Recurse -Filter 'TEST-*.xml' | ForEach-Object {
 $xml=[xml](Get-Content -LiteralPath $_.FullName -Raw)
 [ordered]@{path=$_.FullName.Substring($out.Length+1);suite=$xml.testsuite.name;tests=[int]$xml.testsuite.tests;failures=[int]$xml.testsuite.failures;errors=[int]$xml.testsuite.errors;skipped=[int]$xml.testsuite.skipped}
})
$reports | ConvertTo-Json -Depth 4 | Set-Content "$out/report-inventory.json"
$readme=(Get-FileHash -LiteralPath "$repo/README.md" -Algorithm SHA256).Hash
[ordered]@{productFiles=$results.Count;copies=$RuntimeRoots;historicalProofs=$historic.Count;readme=$readme;readmeMatchesHistorical=$readme -eq '6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA';status=@(git -C $repo status --short);head=(git -C $repo rev-parse HEAD);branch=(git -C $repo branch --show-current)} | ConvertTo-Json -Depth 5 | Set-Content "$out/preservation-final.json"
Write-Output "Preserved $($results.Count) product sources in repository and $($RuntimeRoots.Count) copies; $($historic.Count) original proofs; README=$readme"
