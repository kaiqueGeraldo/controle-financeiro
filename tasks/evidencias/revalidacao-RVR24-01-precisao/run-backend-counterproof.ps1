$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$copy=([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'ng01/copy-path.txt'))).Trim()
$file=Join-Path $copy 'src/main/java/com/controlefinanceiro/api/service/intent/internal/PostgresFinancialIntents.java'
$bytes=[IO.File]::ReadAllBytes($file)
$before=(Get-FileHash -LiteralPath $file).Hash
$results=[ordered]@{before=$before;mutation='remove USE_BIG_DECIMAL_FOR_FLOATS from local reader';copy=$copy}
$env:JAVA_HOME=([IO.File]::ReadAllText((Join-Path $root 'tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt'))).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
try {
  $text=[IO.File]::ReadAllText($file)
  $old='.with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)'
  if(!$text.Contains($old)){throw 'Unexpected candidate'}
  [IO.File]::WriteAllText($file,$text.Replace($old,''))
  & (Join-Path $copy 'mvnw.cmd') -f (Join-Path $copy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=FinancialIntentsIntegrationTest#exactExistingDecimalReceiptSurvivesRecoveryAndTypedReplayWithoutRewrite' test *> (Join-Path $PSScriptRoot 'backend-old.log')
  $results.mutant_exit=$LASTEXITCODE
} finally {
  [IO.File]::WriteAllBytes($file,$bytes)
  $results.restored=(Get-FileHash -LiteralPath $file).Hash
  if($results.restored -ne $before){throw 'Restoration mismatch'}
  $results | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'backend-counterproof.json')
}
& (Join-Path $copy 'mvnw.cmd') -f (Join-Path $copy 'pom.xml') --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=FinancialIntentsIntegrationTest#exactExistingDecimalReceiptSurvivesRecoveryAndTypedReplayWithoutRewrite' test *> (Join-Path $PSScriptRoot 'backend-restored.log')
$results.restored_exit=$LASTEXITCODE
$results | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'backend-counterproof.json')
