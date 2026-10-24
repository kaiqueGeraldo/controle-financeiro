param([Parameter(Mandatory=$true)][string]$RuntimeRoot,[Parameter(Mandatory=$true)][string]$Evidence)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../../..").Path
$runtime=(Resolve-Path -LiteralPath $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-033/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Only an isolated CF033 copy is allowed'}
$out=[IO.Path]::GetFullPath($Evidence)
if(Test-Path -LiteralPath $out){throw 'Preserve previous mutation evidence'}
New-Item -ItemType Directory -Path $out | Out-Null
& "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/baseline" -Tests 'Cf033AdversarialIntegrationTest'
if($LASTEXITCODE -ne 0){throw 'Baseline must pass before mutating sources'}
$base='backend/src/main/java/com/controlefinanceiro/api'
$cases=@(
 @{name='realizado';file='domain/transaction/TransactionRepository.java';
   pattern='(?s)(// Resultado gerencial:.*?AND t.status IN \()';
   replacement='$1com.controlefinanceiro.api.domain.transaction.TransactionStatus.PENDING,';
   test='pendingAcrossYearAndExactCentsAgreeInCashReportsAndXlsx';reason='previsao250 nao e renda realizada'},
 @{name='owner';file='service/AccountService.java';
   before='repository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(user.getId())';after='repository.findAll()';
   test='collectionOwnershipRemainsExactWithDistinctOwnerAndArchivedSource';reason='colecao inclui exclusivamente contas ativas do principal'},
 @{name='parcela';file='service/CreditCardService.java';before='if (i == parcelas - 1) {';after='if (i == 0) {';
   test='finalRemainderAndCompetencesCrossTheYearWithoutPartialInvalidPurchase';reason='resto deve ficar na ultima parcela, nao na primeira'},
 @{name='idempotencia';file='service/TransactionService.java';before='if(previous!=null) return previous;';after='if(previous!=null) { /* regression: ignore the durable result */ }';
   test='replayAfterNewMovementReturnsOriginalIdentityAndConflictingContentDoesNotWrite';reason='replay deve preservar identidade e efeito economico unico'}
)
$results=@()
foreach($case in $cases){
 $target=Join-Path $runtime "$base/$($case.file)"
 $original=[IO.File]::ReadAllBytes($target)
 $source=[Text.Encoding]::UTF8.GetString($original)
 $before=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
 if($case.pattern){
  if([regex]::Matches($source,$case.pattern).Count -ne 1){throw 'Mutation pattern must have one match'}
  $mutated=[regex]::Replace($source,$case.pattern,$case.replacement)
 }else{
  if(($source.Split([string[]]@($case.before),[StringSplitOptions]::None).Count-1) -ne 1){throw 'Mutation target must be unique'}
  $mutated=$source.Replace($case.before,$case.after)
 }
 [IO.File]::WriteAllBytes("$out/$($case.name)-before.txt",$original)
 [IO.File]::WriteAllText("$out/$($case.name)-after.txt",$mutated)
 $exitCode=$null
 try{
  [IO.File]::WriteAllText($target,$mutated)
  $during=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  & "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/$($case.name)" -Tests "Cf033AdversarialIntegrationTest#$($case.test)"
  $exitCode=$LASTEXITCODE
 }finally{
  [IO.File]::WriteAllBytes($target,$original)
  $restored=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  if($restored -ne $before){throw 'Source restoration failed'}
 }
 $xmlFiles=@(Get-ChildItem "$out/$($case.name)/reports" -Filter 'TEST-*.xml')
 if($xmlFiles.Count -ne 1){throw 'Exactly one fresh test report is required'}
 $report=[xml](Get-Content -LiteralPath $xmlFiles[0].FullName -Raw)
 $suite=$report.testsuite
 $result=[ordered]@{mutation=$case.name;file=$case.file;reason=$case.reason;test=$case.test;exit=$exitCode;tests=$suite.tests;failures=$suite.failures;errors=$suite.errors;skipped=$suite.skipped;before=$before;mutated=$during;restored=$restored;failure=@($suite.testcase.failure | ForEach-Object { $_.message })}
 $results+=$result
 $results | ConvertTo-Json -Depth 8 | Set-Content "$out/results.json"
 if($exitCode -eq 0 -or [int]$suite.failures -ne 1 -or [int]$suite.errors -ne 0 -or [int]$suite.tests -ne 1 -or [int]$suite.skipped -ne 0){throw "Mutant $($case.name) was not killed by one assertion; inspect preserved evidence"}
}
& "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/restored" -Tests 'Cf033AdversarialIntegrationTest'
if($LASTEXITCODE -ne 0){throw 'Restored control failed'}
