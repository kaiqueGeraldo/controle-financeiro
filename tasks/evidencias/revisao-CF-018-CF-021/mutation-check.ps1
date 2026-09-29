$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$backend = Join-Path $repo 'controle-financeiro-backend'
$copy = Join-Path $backend ('target/review-mutation-' + [Guid]::NewGuid().ToString('N'))
$archive = "$copy.zip"
git -C $repo archive --format=zip --output=$archive 46d9fad controle-financeiro-backend
if ($LASTEXITCODE -ne 0) { throw 'git archive failed' }
Expand-Archive -LiteralPath $archive -DestinationPath $copy
$candidate = Join-Path $copy 'controle-financeiro-backend'
$card = Join-Path $candidate 'src/main/java/com/controlefinanceiro/api/service/CreditCardService.java'
$repository = Join-Path $candidate 'src/main/java/com/controlefinanceiro/api/domain/transaction/TransactionRepository.java'
$originalCard = [IO.File]::ReadAllBytes($card)
$originalRepository = [IO.File]::ReadAllBytes($repository)
$hashCard = (Get-FileHash -LiteralPath $card).Hash
$hashRepository = (Get-FileHash -LiteralPath $repository).Hash
$cardText = [IO.File]::ReadAllText($card)
if (-not $cardText.Contains('if (i == parcelas - 1)')) { throw 'card mutation anchor missing' }
$repositoryText = [IO.File]::ReadAllText($repository)
$anchor = '(?m)^                com\.controlefinanceiro\.api\.domain\.transaction\.TransactionOrigin\.ACCOUNT_OPENING,\r?\n(?=                com\.controlefinanceiro\.api\.domain\.transaction\.TransactionOrigin\.INVOICE_PAYMENT,)'
if ([regex]::Matches($repositoryText, $anchor).Count -ne 1) { throw 'query mutation anchor missing or ambiguous' }
$env:JAVA_HOME = (Get-ChildItem (Join-Path $backend 'target/temurin21') -Directory | Select-Object -First 1 -ExpandProperty FullName)
$selection = '-Dtest=Cf019CardIntegrationTest#finalInstallmentGetsTheRemainderAndEachInstallmentHasOneSuccessiveCompetence,Cf021ReportingIntegrationTest#periodResultExcludesOpeningPendingTransferAndInvestmentPrincipal'
try {
  [IO.File]::WriteAllText($card, $cardText.Replace('if (i == parcelas - 1)', 'if (i == 0)'))
  [IO.File]::WriteAllText($repository, [regex]::Replace($repositoryText, $anchor, ''))
  Push-Location $candidate
  try {
    & .\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' $selection test *> (Join-Path $PSScriptRoot 'mutation-red.log')
    $redExit = $LASTEXITCODE
  } finally { Pop-Location }
} finally {
  [IO.File]::WriteAllBytes($card, $originalCard)
  [IO.File]::WriteAllBytes($repository, $originalRepository)
}
if ((Get-FileHash -LiteralPath $card).Hash -ne $hashCard -or (Get-FileHash -LiteralPath $repository).Hash -ne $hashRepository) { throw 'restoration mismatch' }
Push-Location $candidate
try {
  & .\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' $selection test *> (Join-Path $PSScriptRoot 'mutation-restored.log')
  $greenExit = $LASTEXITCODE
} finally { Pop-Location }
"candidate=46d9fad; redExit=$redExit; restoredExit=$greenExit; byte-restoration=verified; copy=$copy" | Set-Content (Join-Path $PSScriptRoot 'mutation-result.txt')
if ($redExit -eq 0 -or $greenExit -ne 0) { throw 'mutation must fail and restored candidate must pass; inspect logs' }
