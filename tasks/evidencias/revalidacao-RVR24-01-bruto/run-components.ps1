param([string]$RunName='component-rerun')
$ErrorActionPreference='Stop'
if($RunName -notmatch '^[a-z0-9-]+$'){throw 'Nome inválido'}
$run=Join-Path $PSScriptRoot $RunName
if(Test-Path -LiteralPath $run){throw 'Preservar execução anterior; escolha outro RunName'}
New-Item -ItemType Directory -Path $run | Out-Null
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$copy=([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'frontend-copy.txt'))).Trim()
$source=Join-Path $copy 'src/services/creationResult.ts'
$bytes=[IO.File]::ReadAllBytes($source)
$before=(Get-FileHash -LiteralPath $source).Hash
$original=Join-Path $root 'tasks/evidencias/revisao-CF-025-CF-027-RV24/financial-result-review.test.tsx'
$test=Join-Path $copy 'tests/component/financial-result-review.test.tsx'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'decimal-independent.test.tsx') -Destination (Join-Path $copy 'tests/component/decimal-independent.test.tsx')
if((Get-FileHash $original).Hash -ne (Get-FileHash $test).Hash){throw 'Probe original difere'}
$expected='0174865C3F241459BB2DFAE5EB9540B2A95C47C92BE72F5B427A59DCB5A69143'
if((Get-FileHash $test).Hash -ne $expected){throw 'Hash original inesperado'}
$old=(git -C $root show 'c45bfb6:controle-financeiro-frontend/src/services/creationResult.ts') -join "`n"
if($LASTEXITCODE -ne 0){throw 'Não leu base'}
Push-Location $copy
try {
  [IO.File]::WriteAllText($source,$old)
  & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/financial-result-review.test.tsx *> (Join-Path $run 'original-red.log')
  $red=$LASTEXITCODE
} finally { [IO.File]::WriteAllBytes($source,$bytes); Pop-Location }
if((Get-FileHash $source).Hash -ne $before){throw 'Restauração diverge'}
Push-Location $copy
try {
  & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/financial-result-review.test.tsx *> (Join-Path $run 'original-restored.log')
  $restored=$LASTEXITCODE
  & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/financial-result-review.test.tsx tests/component/rv24-gross.test.tsx tests/component/rv24-residual.test.tsx tests/component/rv24-independent-review.test.tsx tests/component/rv24-creation-intent.test.tsx tests/component/temporal-forms.test.tsx tests/component/async-state.test.tsx tests/component/decimal-independent.test.tsx *> (Join-Path $run 'components.log')
  $gate=$LASTEXITCODE
} finally { Pop-Location }
[pscustomobject]@{red_exit=$red;restored_exit=$restored;components_exit=$gate;probe_sha256=$expected;candidate_before=$before;candidate_restored=(Get-FileHash $source).Hash} | ConvertTo-Json | Set-Content (Join-Path $run 'components-result.json')
Get-Content (Join-Path $run 'components.log') -Tail 8
# Candidate gate remains red until the residual monetary ceiling is repaired.
if($red -ne 1 -or $restored -ne 0 -or $gate -ne 0){exit 1}
