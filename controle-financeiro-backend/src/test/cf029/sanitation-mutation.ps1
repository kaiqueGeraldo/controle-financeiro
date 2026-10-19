param([Parameter(Mandatory=$true)][string]$Workspace)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$Workspace=[IO.Path]::GetFullPath($Workspace)
if($Workspace.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'Use an isolated directory outside the checkout'}
if(Test-Path -LiteralPath $Workspace){throw 'Preserve existing runtime'}
New-Item -ItemType Directory -Path $Workspace | Out-Null
$out="$root/tasks/evidencias/saneamento-CF-029-RC029-01"
git -C $root archive --format=zip -o "$Workspace/base.zip" HEAD controle-financeiro-backend
if($LASTEXITCODE -ne 0){throw 'Archive failed'}
Expand-Archive -LiteralPath "$Workspace/base.zip" -DestinationPath $Workspace
$backend="$Workspace/controle-financeiro-backend"
$overlays=@(
 'src/main/java/com/controlefinanceiro/api/domain/onboarding/DraftConsistency.java',
 'src/main/java/com/controlefinanceiro/api/service/onboarding/DraftReferences.java',
 'src/test/java/com/controlefinanceiro/api/domain/onboarding/OnboardingReservationIssueTest.java'
)
foreach($relative in $overlays){Copy-Item -LiteralPath "$root/controle-financeiro-backend/$relative" -Destination "$backend/$relative"}
$manifest=@(Get-ChildItem $backend -Recurse -File | ForEach-Object {
 [pscustomobject]@{path=[IO.Path]::GetRelativePath($backend,$_.FullName);sha256=(Get-FileHash -LiteralPath $_.FullName).Hash}
})
$manifest | ConvertTo-Json | Set-Content "$out/isolated-source-before.json"
$file="$backend/src/main/java/com/controlefinanceiro/api/service/onboarding/DraftReferences.java"
$original=[IO.File]::ReadAllBytes($file);$before=(Get-FileHash -LiteralPath $file).Hash
$anchor='issues.addAll(DraftConsistency.reservationGoalIssues(write.payload(),goalTypes));'
$tests='OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue,OnboardingReservationIssueTest#reservationGoalTypeUsesCreateAliasAndOwnedId+reservationAssignChecksSameGoalWithoutChangingProtectedRecord'
try {
 $content=[IO.File]::ReadAllText($file)
 if(-not $content.Contains($anchor)){throw 'Missing mutation anchor'}
 [IO.File]::WriteAllText($file,$content.Replace($anchor,'// RC029-01 counterproof: omit goal compatibility evaluation.'))
 [IO.File]::WriteAllText("$out/mutation.diff","--- DraftReferences.java`n+++ isolated/DraftReferences.java`n-$anchor`n+// RC029-01 counterproof: omit goal compatibility evaluation.`n")
 & "$PSScriptRoot/sanitation-run.ps1" -Name mutation-missing-rule -Tests $tests -Backend $backend
 $mutantExit=$LASTEXITCODE
} finally {
 [IO.File]::WriteAllBytes($file,$original)
 $after=(Get-FileHash -LiteralPath $file).Hash
 if($after -ne $before){throw 'Restoration failed'}
 $integrity=@($manifest | ForEach-Object {
  $actual=(Get-FileHash -LiteralPath "$backend/$($_.path)").Hash
  [pscustomobject]@{path=$_.path;before=$_.sha256;after=$actual;restored=($actual -eq $_.sha256)}
 })
 $integrity | ConvertTo-Json | Set-Content "$out/isolated-source-after.json"
 if(@($integrity | Where-Object {-not $_.restored}).Count){throw 'Isolated source integrity mismatch'}
}
$reports=@(Get-ChildItem "$out/mutation-missing-rule/reports/TEST-*.xml" | ForEach-Object { [xml]$xml=Get-Content -LiteralPath $_.FullName -Raw; $xml.testsuite })
$failures=($reports | Measure-Object -Property failures -Sum).Sum
$errors=($reports | Measure-Object -Property errors -Sum).Sum
[ordered]@{base=(git -C $root rev-parse HEAD);backend=$backend;overlays=$overlays;exitCode=$mutantExit;failures=$failures;errors=$errors;before=$before;after=$after;restored=($before -eq $after);allSourcesRestored=($integrity.Count)} | ConvertTo-Json | Set-Content "$out/mutation.json"
if($mutantExit -eq 0 -or $failures -ne 7 -or $errors -ne 0){throw 'Counterproof did not fail as expected; inspect preserved evidence'}
& "$PSScriptRoot/sanitation-run.ps1" -Name isolated-restored -Tests $tests -Backend $backend
if($LASTEXITCODE -ne 0){throw 'Restored control failed'}
