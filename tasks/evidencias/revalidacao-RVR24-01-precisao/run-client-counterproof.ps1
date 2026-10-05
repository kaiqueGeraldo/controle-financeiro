$ErrorActionPreference='Stop'
$copy=([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'frontend-copy.txt'))).Trim()
$file=Join-Path $copy 'src/services/api.ts'
$bytes=[IO.File]::ReadAllBytes($file)
$before=(Get-FileHash -LiteralPath $file).Hash
$results=[ordered]@{before=$before;mutation='apiRequest: replace opt-in decimal parser with JSON.parse only'}
try {
  $text=[IO.File]::ReadAllText($file)
  $old='return investmentSnapshot ? parseInvestmentResultJson(body) : JSON.parse(body) as unknown;'
  if(!$text.Contains($old)){throw 'Unexpected candidate'}
  [IO.File]::WriteAllText($file,$text.Replace($old,'return JSON.parse(body) as unknown;'))
  Push-Location $copy
  node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/json-precision-original.test.tsx *> (Join-Path $PSScriptRoot 'client-old-original.log')
  $results.original_exit=$LASTEXITCODE
  node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/parser-independent.test.tsx -t 'inherited-only' *> (Join-Path $PSScriptRoot 'client-old-inheritance.log')
  $results.inheritance_exit=$LASTEXITCODE
  Pop-Location
} finally {
  [IO.File]::WriteAllBytes($file,$bytes)
  $results.restored=(Get-FileHash -LiteralPath $file).Hash
  $results | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'client-counterproof.json')
  if($results.restored -ne $before){throw 'Restoration mismatch'}
}
