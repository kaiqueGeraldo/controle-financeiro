$ErrorActionPreference='Stop'
Set-Location "$PSScriptRoot/../../../controle-financeiro-frontend"
$results=@()
foreach($zone in @('America/Sao_Paulo','UTC','Pacific/Kiritimati')) {
  $env:TZ=$zone
  $env:CF_TEST_TIMEZONE=$zone
  $suffix=$zone.Replace('/','-')
  npm run test:component -- --reporter=dot tests/component/rf15-causal.test.tsx *> "$PSScriptRoot/components-$suffix.log"
  $results+="$zone exit=$LASTEXITCODE"
}
$results | Set-Content "$PSScriptRoot/components-zones.txt"
