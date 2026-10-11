$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path "$PSScriptRoot/../../..").Path
$isolated=Join-Path $repoRoot 'controle-financeiro-frontend/tests/artifacts/rf15-counterproof'
if(Test-Path -LiteralPath $isolated){throw 'A cópia isolada já existe; não sobrescrever prova anterior.'}
New-Item -ItemType Directory -Path $isolated | Out-Null
Set-Location $repoRoot
git archive bc5532c -o "$isolated/base.zip" controle-financeiro-frontend/src controle-financeiro-frontend/tests/component/vitest.config.mts controle-financeiro-frontend/tests/component/setup.ts controle-financeiro-frontend/package.json
Expand-Archive -LiteralPath "$isolated/base.zip" -DestinationPath $isolated
$front=Join-Path $isolated 'controle-financeiro-frontend'
New-Item -ItemType Junction -Path "$front/node_modules" -Target "$repoRoot/controle-financeiro-frontend/node_modules" | Out-Null
Copy-Item -LiteralPath "$repoRoot/controle-financeiro-frontend/tests/component/rf15-causal.test.tsx" -Destination "$front/tests/component/rf15-causal.test.tsx"
Set-Location $front
npm run test:component -- --reporter=dot tests/component/rf15-causal.test.tsx *> "$PSScriptRoot/counterproof-base.log"
$result=$LASTEXITCODE
Set-Location $repoRoot
Get-FileHash "$front/tests/component/rf15-causal.test.tsx","$repoRoot/controle-financeiro-frontend/tests/component/rf15-causal.test.tsx" | Format-List | Out-File "$PSScriptRoot/counterproof-hashes.txt"
exit $result
