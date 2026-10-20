param([Parameter(Mandatory=$true)][string]$IsolatedBackend)
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$copy=(Resolve-Path -LiteralPath $IsolatedBackend).Path
$allowed='C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1598d-84a2-7cb3-8777-089eb30b441d\cf030-copy'
if($copy -ne $allowed){throw 'Mutation only allowed in dedicated review copy'}
$file=Join-Path $copy 'src/main/java/com/controlefinanceiro/api/service/GoalService.java'
$bytes=[IO.File]::ReadAllBytes($file)
$sha=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
$text=[IO.File]::ReadAllText($file)
$pattern='(public void setAllocation\(UUID goalId, SetGoalAllocationDTO data, User user\) \{\s*)inventoryGuard\.writer\(user\.getId\(\)\);'
if([regex]::Matches($text,$pattern).Count -ne 1){throw 'Mutation anchor must match exactly once'}
$mutated=[regex]::Replace($text,$pattern,'$1/* REVIEW MUTATION: omitted shared inventory guard */')
$out="$root/tasks/evidencias/revisao-CF-030"
try {
 [IO.File]::WriteAllText($file,$mutated)
 & "$PSScriptRoot/review-run.ps1" -Name mutation-real-reservation-writer -Tests 'OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication' -Backend $copy
 $code=$LASTEXITCODE
 @'
--- service/GoalService.java
+++ isolated/service/GoalService.java
@@ public void setAllocation(UUID goalId, SetGoalAllocationDTO data, User user)
-        inventoryGuard.writer(user.getId());
+        /* REVIEW MUTATION: omitted shared inventory guard */
'@ | Set-Content "$out/mutation-real-reservation-writer/mutation.diff"
} finally {
 [IO.File]::WriteAllBytes($file,$bytes)
 [ordered]@{isolatedBackend=$copy;file='GoalService.java#setAllocation';before=$sha;after=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash;exitCode=$code;mutation='Remove only inventoryGuard.writer from real GoalService.setAllocation'} | ConvertTo-Json | Set-Content "$out/mutation-restoration.json"
}
if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $sha){throw 'Restoration mismatch'}
exit 0
