param([Parameter(Mandatory=$true)][string]$Workspace)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$Workspace=[IO.Path]::GetFullPath($Workspace)
if($Workspace.StartsWith($root,[StringComparison]::OrdinalIgnoreCase) -or (Test-Path -LiteralPath $Workspace)){throw 'Use a new isolated directory outside checkout'}
New-Item -ItemType Directory -Path $Workspace | Out-Null
$out="$root/tasks/evidencias/revalidacao-CF-029-RC029-01"
git -C $root archive --format=zip -o "$Workspace/candidate.zip" aa88ecc controle-financeiro-backend
if($LASTEXITCODE -ne 0){throw 'Archive failed'}
Expand-Archive -LiteralPath "$Workspace/candidate.zip" -DestinationPath $Workspace
$backend="$Workspace/controle-financeiro-backend"
$file="$backend/src/main/java/com/controlefinanceiro/api/service/onboarding/DraftReferences.java"
$original=[IO.File]::ReadAllBytes($file);$before=(Get-FileHash -LiteralPath $file).Hash
$anchor='issues.addAll(DraftConsistency.reservationGoalIssues(write.payload(),goalTypes));'
$tests='OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue,OnboardingReservationIssueTest#reservationGoalTypeUsesCreateAliasAndOwnedId+reservationAssignChecksSameGoalWithoutChangingProtectedRecord'
try {
 $content=[IO.File]::ReadAllText($file)
 if(-not $content.Contains($anchor)){throw 'Missing mutation anchor'}
 [IO.File]::WriteAllText($file,$content.Replace($anchor,'// Independent counterproof: omit compatibility evaluation.'))
 [IO.File]::WriteAllText("$out/mutation.diff","--- DraftReferences.java`n+++ isolated/DraftReferences.java`n-$anchor`n+// Independent counterproof: omit compatibility evaluation.`n")
 & "$PSScriptRoot/revalidation-run.ps1" -Name rule-removed -Tests $tests -Backend $backend -Zone America/Sao_Paulo
 $mutantExit=$LASTEXITCODE
} finally {
 [IO.File]::WriteAllBytes($file,$original)
 $after=(Get-FileHash -LiteralPath $file).Hash
 if($after -ne $before){throw 'Restoration failed'}
}
$reports=@(Get-ChildItem "$out/rule-removed/reports/TEST-*.xml" | ForEach-Object {[xml]$xml=Get-Content -LiteralPath $_.FullName -Raw;$xml.testsuite})
$failures=($reports | Measure-Object -Property failures -Sum).Sum
$errors=($reports | Measure-Object -Property errors -Sum).Sum
[ordered]@{candidate='aa88eccb18b5e9eb7ae5794e6204191d823bb588';backend=$backend;exitCode=$mutantExit;failures=$failures;errors=$errors;before=$before;after=$after;restored=($before -eq $after)} | ConvertTo-Json | Set-Content "$out/mutation.json"
if($mutantExit -eq 0 -or $failures -ne 7 -or $errors -ne 0){throw 'Counterproof failed unexpectedly; preserve evidence'}
& "$PSScriptRoot/revalidation-run.ps1" -Name restored-rule -Tests $tests -Backend $backend -Zone America/Sao_Paulo
if($LASTEXITCODE -ne 0){throw 'Restored control failed'}
