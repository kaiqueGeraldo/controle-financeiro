param([Parameter(Mandatory=$true)][string]$Backend,[string]$Prefix='mutation')
$ErrorActionPreference='Stop'
if($Prefix -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$'){throw 'Use a unique simple evidence prefix'}
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$Backend=(Resolve-Path -LiteralPath $Backend).Path
$allowed='C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1598d-84a2-7cb3-8777-089eb30b441d\cf030-revalidation-copy'
if($Backend -ne $allowed -or $Backend -eq "$root\controle-financeiro-backend"){throw 'Use the dedicated isolated RC030 copy'}
$base='251d6c70492e4ad57dc9ca1313dce17afab62464'
$evidence="$root/tasks/evidencias/revalidacao-CF-030-RC030"
$cases=@(
 @{id='rc030-01';files=@('service/CreditCardService.java');tests='OnboardingReviewFinancialTest#identifiedChargesMustBePaidBeforeOlderPrincipalAcrossRolledInvoices'},
 @{id='rc030-02';files=@('domain/onboarding/OnboardingFinalRules.java','service/onboarding/OnboardingProjection.java','service/onboarding/OnboardingOpenings.java');tests='OnboardingReviewFinancialTest#initializeEmptyMustRejectCalculatedDateOutsideCivilContractAtPrepare+initializedInvoiceCannotPersistYear10000BehindACompletedReceipt'},
 @{id='rc030-02-binding';files=@('domain/card/Invoice.java');tests='OnboardingRevalidationCivilTest#allInvoiceCivilColumnsRoundTripAndExistingSqlDatesRemainLiteral'},
 @{id='rc030-03';files=@('domain/onboarding/OnboardingCommand.java');tests='OnboardingReviewFinancialTest#oversizedContractVersionMustNotWrapToV1OnPrepare'}
)
$results=@()
foreach($case in $cases){
 $name="$Prefix-$($case.id)";$originals=@();$diff=@()
 try {
  foreach($file in $case.files){
   $rel="src/main/java/com/controlefinanceiro/api/$file";$path=Join-Path $Backend $rel
   $bytes=[IO.File]::ReadAllBytes($path);$sha=(Get-FileHash -LiteralPath $path).Hash
   $originals+=@{path=$path;bytes=$bytes;sha256=$sha;relative=$rel}
   $audit=Join-Path $Backend ".rc030-audit/$name/$rel";New-Item -ItemType Directory -Path (Split-Path $audit -Parent) -Force|Out-Null
   [IO.File]::WriteAllBytes($audit,$bytes)
   $prior=@(git -C $root show "${base}:controle-financeiro-backend/$rel")
   if($LASTEXITCODE -ne 0){throw 'Baseline read failed'}
   [IO.File]::WriteAllText($path,($prior -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
   $delta=@(git -c core.safecrlf=false diff --no-index -- $audit $path)
   if($LASTEXITCODE -notin @(0,1)){throw 'Mutation diff failed'}
   $diff+=$delta
  }
  & "$PSScriptRoot/revalidation-run.ps1" -Name $name -Tests $case.tests -Backend $Backend
  $code=$LASTEXITCODE
  $diff|Set-Content "$evidence/$name/mutation.diff"
 }finally{
  foreach($original in $originals){[IO.File]::WriteAllBytes($original.path,$original.bytes);if((Get-FileHash -LiteralPath $original.path).Hash -ne $original.sha256){throw 'Restoration mismatch'}}
 }
 $failures=0;$errors=0;$tests=0
 Get-ChildItem "$evidence/$name/reports" -Filter 'TEST-*.xml'|ForEach-Object{[xml]$xml=Get-Content -LiteralPath $_.FullName -Raw;$tests+=[int]$xml.testsuite.tests;$failures+=[int]$xml.testsuite.failures;$errors+=[int]$xml.testsuite.errors}
 $results+=@{name=$name;exitCode=$code;tests=$tests;failures=$failures;errors=$errors;restored=@($originals|ForEach-Object{@{path=$_.relative;sha256=$_.sha256;after=(Get-FileHash -LiteralPath $_.path).Hash}})}
 $results|ConvertTo-Json -Depth 6|Set-Content "$evidence/$Prefix-restoration.json"
 if($code -eq 0 -or $failures -lt 1 -or $errors -gt 0){throw 'Mutation survived or failed without a causal assertion; inspect evidence'}
}
& "$PSScriptRoot/revalidation-run.ps1" -Name "$Prefix-restored-control" -Tests 'OnboardingReviewFinancialTest,OnboardingRc030PaymentTest,OnboardingRc030CivilTest,OnboardingRc030VersionTest,OnboardingRevalidationCivilTest' -Backend $Backend
if($LASTEXITCODE -ne 0){throw 'Restored control failed'}
