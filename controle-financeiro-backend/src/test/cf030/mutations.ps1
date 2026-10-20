param([Parameter(Mandatory=$true)][string]$Backend, [string]$Prefix='')
$ErrorActionPreference='Stop'
if($Prefix -and $Prefix -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$'){throw 'Use a simple unique evidence prefix'}
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$Backend=(Resolve-Path -LiteralPath $Backend).Path
$isolationRoot='C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1570b-cd5c-77c0-b013-cf54480e8e48'
if(-not $Backend.StartsWith("$isolationRoot\cf030-counterproof-") -or $Backend -eq "$root\controle-financeiro-backend"){throw 'Use the dedicated isolated CF030 copy'}
$cases=@(
 @{name='mutation-stale-review';file='service/onboarding/OnboardingApplicationService.java';changes=@(
   @{old='if(!current.token().equals(frozen.at("/sourceSnapshot/inventoryToken").asText()))';new='if(false)'},
   @{old='if(!reviewHash(review).equals(command.reviewHash()))';new='if(false)'});
   tests='OnboardingApplicationTest#sourceChangedAfterSaveIsReassessedAndAfterReviewIsRejected'},
 @{name='mutation-double-opening';file='service/onboarding/OnboardingOpenings.java';changes=@(
   @{old='a.open(fact(item.path("balance")),p.baseDate,now,OpeningBalanceOrigin.USER_PROVIDED);';new='a.open(fact(item.path("balance")).multiply(new BigDecimal("2")),p.baseDate,now,OpeningBalanceOrigin.USER_PROVIDED);'});
   tests='OnboardingApplicationTest#e01AppliesStocksWithoutHistoryAndReceiptIsRecoveredExactly'},
 @{name='mutation-partial-commit';file='service/onboarding/OnboardingApplicationService.java';changes=@(
   @{old="    @Transactional`n    public JsonNode complete(";new="    @Transactional(noRollbackFor=IllegalStateException.class)`n    public JsonNode complete("});
   tests='OnboardingAtomicityEventTest#applicationFailureAfterReceiptAndTerminalWritesRollsBackEntireCommitAndCache'},
 @{name='mutation-uncertain-new-source';file='service/onboarding/OnboardingProjection.java';changes=@(
   @{old='if(amount.compareTo(previous)>0 && !s.blocking.isEmpty())';new='if(false)'});
   tests='OnboardingReservationsTest#e28NewIdAndCashDoNotMakeAnIndependentSource'}
)
$results=@()
foreach($case in $cases){
 if($Prefix){$case.name="$Prefix-$($case.name)"}
 $path=Join-Path $Backend "src/main/java/com/controlefinanceiro/api/$($case.file)"
 $original=[IO.File]::ReadAllBytes($path);$before=(Get-FileHash -LiteralPath $path).Hash
 $diff="--- $($case.file)`n+++ isolated/$($case.file)`n"
 try {
  $content=[IO.File]::ReadAllText($path).Replace("`r`n","`n")
  foreach($change in $case.changes){
   if(-not $content.Contains($change.old)){throw "Missing mutation anchor: $($case.name)"}
   $content=$content.Replace($change.old,$change.new);$diff+="-$($change.old)`n+$($change.new)`n"
  }
  [IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
  & "$PSScriptRoot/run.ps1" -Name $case.name -Tests $case.tests -Backend $Backend
  $exitCode=$LASTEXITCODE
  [IO.File]::WriteAllText("$root/tasks/evidencias/CF-030/$($case.name)/mutation.diff",$diff)
 }finally{
  [IO.File]::WriteAllBytes($path,$original)
  $after=(Get-FileHash -LiteralPath $path).Hash
  if($after -ne $before){throw 'Isolated mutation source restoration failed'}
 }
 $results+=@{name=$case.name;exitCode=$exitCode;restored=$true;sha256=$before;isolatedBackend=$Backend}
}
$resultName=if($Prefix){"$Prefix-mutations.json"}else{'mutations.json'}
$results | ConvertTo-Json -Depth 5 | Set-Content "$root/tasks/evidencias/CF-030/$resultName"
if(@($results | Where-Object {$_.exitCode -eq 0}).Count){throw 'Surviving mutation: inspect contract and oracle'}
$controlName=if($Prefix){"$Prefix-counterproof-restored"}else{'counterproof-restored'}
& "$PSScriptRoot/run.ps1" -Name $controlName -Tests 'OnboardingApplicationTest,OnboardingAtomicityEventTest,OnboardingReservationsTest' -Backend $Backend
if($LASTEXITCODE -ne 0){throw 'Restored isolated control failed'}
