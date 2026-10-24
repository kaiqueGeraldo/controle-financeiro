$ErrorActionPreference='Stop'
function Check-Mutation([string]$phase,[string]$kind,[string]$selection){
 & "$PSScriptRoot/run.ps1" -Phase $phase -Mutation $kind -Tests $selection
 if($LASTEXITCODE -ne 1){throw "Mutation $kind did not return expected test failure"}
 $reports=@(Get-ChildItem "$PSScriptRoot/$phase/reports" -Filter '*.xml')
 if($reports.Count -ne 1){throw 'Expected one causal report'}
 $report=[xml](Get-Content -LiteralPath $reports[0].FullName -Raw)
 if([int]$report.testsuite.tests -ne 1 -or [int]$report.testsuite.failures -ne 1 -or [int]$report.testsuite.errors -ne 0 -or [int]$report.testsuite.skipped -ne 0){throw 'Mutation was not killed by exactly one assertion'}
}
Check-Mutation 'final-mutation-progress' 'progress' 'Cf033ProgressIndependenceProbeTest'
Check-Mutation 'final-mutation-capacity' 'capacity' 'OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication'
& "$PSScriptRoot/run.ps1" -Phase 'final-restored-control' -Tests 'Cf033ProgressIndependenceProbeTest,OnboardingReviewConcurrencyTest#realReservationWriterCannotSpendCapacityBetweenRevalidationAndApplication'
if($LASTEXITCODE -ne 0){throw 'Restored financial/progress controls failed'}
& "$PSScriptRoot/run.ps1" -Phase 'package-verify' -Package
if($LASTEXITCODE -ne 0){throw 'Packaging/verify failed'}
