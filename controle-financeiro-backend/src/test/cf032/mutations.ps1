param([Parameter(Mandatory=$true)][string]$RuntimeRoot,[Parameter(Mandatory=$true)][string]$Evidence)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../../..").Path
$runtime=(Resolve-Path $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-032/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Mutations require an isolated CF032 runtime'}
$out=[IO.Path]::GetFullPath($Evidence)
if(Test-Path -LiteralPath $out){throw 'Preserve previous mutation evidence'}
New-Item -ItemType Directory -Path $out | Out-Null
function Cases([string]$folder){
 $cases=@(Get-ChildItem -LiteralPath $folder -Filter '*-result.json' | Sort-Object Name | ForEach-Object {
  $case=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
  @{name=$_.Name;status=$case.status;errors=@($case.errors | ForEach-Object {$_ -replace '\x1B\[[0-9;]*m',''})}
 })
 return ($cases | ConvertTo-Json -Depth 8 -Compress)
}
# C deliberately remains red for the independently discovered seconds loss.
# Mutants must add a distinct violated invariant; the restored control must
# reproduce exactly the baseline cases/errors, rather than hide that finding.
& "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/baseline" -Grep 'H dois usuários|C relatório'
$baseline=Cases "$out/baseline"
$mutations=@(
 @{name='owner';file='service/AccountService.java';before='repository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(user.getId())';after='repository.findAll()';grep='H dois usuários';reason='foreign account name must never appear in A UI'},
 @{name='duplicate-credit';file='domain/account/Account.java';before='BigDecimal result = this.balance.add(amount);';after='BigDecimal result = this.balance.add(amount).add(amount);';grep='H dois usuários';reason='A must have1010, not1020'},
 @{name='export-value';file='service/TransactionService.java';before='valCell.setCellValue(dto.amount().doubleValue());';after='valCell.setCellValue(dto.amount().add(new BigDecimal("0.01")).doubleValue());';grep='C relatório';reason='XLSX income row gross must be250.10, not250.11'},
 @{name='export-date';file='service/TransactionService.java';before='dto.date().format(dateFmt)';after='dto.date().plusDays(1).format(dateFmt)';grep='C relatório';reason='civil date must remain22/10, not23/10'}
)
$results=@()
foreach($m in $mutations){
 $target=Join-Path "$runtime/backend/src/main/java/com/controlefinanceiro/api" $m.file
 $source=[IO.File]::ReadAllText($target)
 $originalBytes=[IO.File]::ReadAllBytes($target)
 $initial=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
 if(-not $source.Contains($m.before)){throw "Mutation anchor absent: $($m.name)"}
 $changed=$source.Replace($m.before,$m.after)
 [IO.File]::WriteAllText("$out/$($m.name).patch.txt","$($m.file)`n- $($m.before)`n+ $($m.after)`nExpected detection: $($m.reason)")
 try {
  [IO.File]::WriteAllText($target,$changed)
  & "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/$($m.name)" -Grep $m.grep
  $execution=Get-Content "$out/$($m.name)/execution.json" -Raw | ConvertFrom-Json
  $log=[IO.File]::ReadAllText("$out/$($m.name)/playwright.log")
  $specific=switch($m.name){
   'owner' {$log.Contains('EXCLUSIVO B') -and $log.Contains('toHaveCount')}
   'duplicate-credit' {$log.Contains('1010.00') -and $log.Contains('1020.00')}
   'export-value' {$log.Contains('250.11') -and $log.Contains('250.1')}
   'export-date' {$log.Contains('23/10/2026') -and $log.Contains('22/10/2026')}
  }
  $detected=($execution.exitCode -ne 0 -and $specific -and $log -notmatch 'Cannot find module|No tests found|BadSqlGrammar|Failed to load ApplicationContext')
  $results+=@{name=$m.name;exitCode=$execution.exitCode;detectedByInvariant=$detected;beforeHash=$initial;mutationHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash;reason=$m.reason}
 }finally {
  [IO.File]::WriteAllBytes($target,$originalBytes)
  $restored=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  if($restored -cne $initial){throw "Restoration failed: $($m.name)"}
  if($results.Count){$results[-1].restoredHash=$restored}
  $results | ConvertTo-Json -Depth 5 | Set-Content "$out/results.json"
 }
}
& "$PSScriptRoot/run.ps1" -RuntimeRoot $runtime -Evidence "$out/restored-control" -Grep 'H dois usuários|C relatório'
$control=Get-Content "$out/restored-control/execution.json" -Raw | ConvertFrom-Json
$restored=Cases "$out/restored-control"
$equivalent=$baseline -ceq $restored
@{baselineCases=($baseline|ConvertFrom-Json);restoredCases=($restored|ConvertFrom-Json);equivalent=$equivalent;restoredExitCode=$control.exitCode;knownBaselineFinding='C: supplied seconds are lost in XLSX; assertion deliberately remains red'} | ConvertTo-Json -Depth 10 | Set-Content "$out/restored-comparison.json"
if(-not $equivalent -or ($results | Where-Object {-not $_.detectedByInvariant})){throw 'Mutation detection or restored control equivalence failed; preserve all artifacts'}
