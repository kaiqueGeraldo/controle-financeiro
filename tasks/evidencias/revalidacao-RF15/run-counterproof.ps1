$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path "$PSScriptRoot/../../..").Path
$isolated = Join-Path $repo 'controle-financeiro-frontend/tests/artifacts/rf15-independent-counterproof'
if (Test-Path -LiteralPath $isolated) { throw 'Não sobrescrever contraprova anterior.' }
New-Item -ItemType Directory -Path $isolated | Out-Null
Set-Location $repo
git archive db2d77d -o "$isolated/candidate.zip" controle-financeiro-frontend/src controle-financeiro-frontend/tests/component/vitest.config.mts controle-financeiro-frontend/tests/component/setup.ts controle-financeiro-frontend/package.json
Expand-Archive -LiteralPath "$isolated/candidate.zip" -DestinationPath $isolated
$front = Join-Path $isolated 'controle-financeiro-frontend'
New-Item -ItemType Junction -Path "$front/node_modules" -Target "$repo/controle-financeiro-frontend/node_modules" | Out-Null
Copy-Item "$repo/controle-financeiro-frontend/tests/component/cards-planning-audit.test.tsx" "$front/tests/component/cards-planning-audit.test.tsx"
$source = 'controle-financeiro-frontend/src/components/screens/cards/invoiceDetails.tsx'
$candidateHash = (Get-FileHash "$repo/$source").Hash
git show "bc5532c:$source" | Set-Content "$isolated/$source" -Encoding utf8
Set-Location $front
npm run test:component -- --reporter=dot tests/component/cards-planning-audit.test.tsx *> "$PSScriptRoot/counterproof-old-formula.log"
$mutationExit = $LASTEXITCODE
Copy-Item "$repo/$source" "$isolated/$source"
npm run test:component -- --reporter=dot tests/component/cards-planning-audit.test.tsx *> "$PSScriptRoot/counterproof-restored.log"
$restoredExit = $LASTEXITCODE
Set-Location $repo
[pscustomobject]@{mutationExit=$mutationExit;restoredExit=$restoredExit;mainUnchanged=((Get-FileHash "$repo/$source").Hash -eq $candidateHash);isolatedRestored=((Get-FileHash "$isolated/$source").Hash -eq $candidateHash);testIdentical=((Get-FileHash "$front/tests/component/cards-planning-audit.test.tsx").Hash -eq (Get-FileHash "$repo/controle-financeiro-frontend/tests/component/cards-planning-audit.test.tsx").Hash)} | ConvertTo-Json | Set-Content "$PSScriptRoot/counterproof.json"
if ($mutationExit -eq 0 -or $restoredExit -ne 0) { exit 1 }
