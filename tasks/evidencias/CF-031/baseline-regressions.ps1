$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$baseline=Join-Path ([IO.Path]::GetTempPath()) ('cf031-baseline-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $baseline | Out-Null
& git -C $repo archive --format=zip --output="$baseline/base.zip" 6d819aa -- controle-financeiro-frontend/src controle-financeiro-frontend/tests/component controle-financeiro-frontend/package.json controle-financeiro-frontend/tsconfig.json
if($LASTEXITCODE -ne 0){throw 'Could not archive approved base'}
Expand-Archive -LiteralPath "$baseline/base.zip" -DestinationPath $baseline
$frontend=Join-Path $baseline 'controle-financeiro-frontend'
New-Item -ItemType Junction -Path "$frontend/node_modules" -Value "$repo/controle-financeiro-frontend/node_modules" | Out-Null
$baseline | Set-Content -LiteralPath "$PSScriptRoot/baseline-path.txt"
Push-Location $frontend
try {
 & 'C:/Program Files/nodejs/node.exe' node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/habit-product-day.test.tsx tests/component/temporal-presentation.test.tsx *> "$PSScriptRoot/baseline-regressions.log"
 $result=$LASTEXITCODE
} finally { Pop-Location }
[ordered]@{base='6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82';isolated=$baseline;exitCode=$result;noCandidateSource=$true} | ConvertTo-Json | Set-Content -LiteralPath "$PSScriptRoot/baseline-regressions.json"
Get-Content -LiteralPath "$PSScriptRoot/baseline-regressions.log" -Tail 50
exit $result
