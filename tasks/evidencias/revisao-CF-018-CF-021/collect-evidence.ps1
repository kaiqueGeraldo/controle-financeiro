# Read existing results only; does not run tests or connect to a database.
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$logs = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$selected = @('backend-suite','baseline-backend-authorized','review-domain-migrations','review-final-probes',
  'mutation-red','mutation-restored','frontend-build-authorized','frontend-unit','frontend-component',
  'frontend-typecheck','lint-comparable','cf016-isolated','browser-harness-visual-final')
foreach ($name in $selected) {
  $source = Join-Path $PSScriptRoot "$name.log"
  if (Test-Path -LiteralPath $source) {
    $content = [IO.File]::ReadAllText($source)
    $content = [regex]::Replace($content, 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[SYNTHETIC_JWT_REDACTED]')
    $content = [regex]::Replace($content, '(?m)[\t ]+(?=\r?$)', '').TrimEnd() + [Environment]::NewLine
    [IO.File]::WriteAllText((Join-Path $logs "$name.log"), $content)
  }
}
foreach ($name in @('second','third','error','visual-final')) {
  $path = Join-Path $PSScriptRoot "browser/playwright-$name.log"
  if (Test-Path -LiteralPath $path) {
    $content = [IO.File]::ReadAllText($path)
    $content = [regex]::Replace($content, 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[SYNTHETIC_JWT_REDACTED]')
    $content = [regex]::Replace($content, '(?m)[\t ]+(?=\r?$)', '').TrimEnd() + [Environment]::NewLine
    [IO.File]::WriteAllText($path, $content)
  }
}
$reportDir = Join-Path $repo 'controle-financeiro-backend/target/surefire-reports'
$summaries = @()
foreach ($class in @('service.IntegratedMilestoneReviewTest','migration.IncrementalMilestoneReviewTest')) {
  [xml]$xml = Get-Content -LiteralPath (Join-Path $reportDir "TEST-com.controlefinanceiro.api.$class.xml") -Raw
  $cases = @($xml.testsuite.testcase | ForEach-Object {
    $failure = [string]$_.failure.message
    if ($failure.Length -gt 2200) { $failure = $failure.Substring(0,2200) }
    [PSCustomObject]@{ name=$_.name; status=if ($_.failure) {'failed'} elseif ($_.error) {'error'} else {'passed'}; failure=$failure }
  })
  $summaries += [PSCustomObject]@{class=$class;tests=$xml.testsuite.tests;failures=$xml.testsuite.failures;errors=$xml.testsuite.errors;cases=$cases}
}
$summaries | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'test-results.json')
