# Reconstruct source fixtures referenced by the old review, never rewrite its evidence.
param([switch]$Resume)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$taskBackend=Join-Path $taskRoot 'controle-financeiro-backend'
$taskHistorical=Join-Path $taskRoot 'tasks/evidencias/revalidacao-RV24-01-RV24-02'
$taskRecovery=Join-Path $taskBackend ('target/cf027-history-reconstruction-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $taskRecovery | Out-Null
$taskArchive=Join-Path $taskRecovery '5d0649a.zip'
& git -C $taskRoot archive --format=zip -o $taskArchive 5d0649a controle-financeiro-backend controle-financeiro-frontend
if($LASTEXITCODE -ne 0){throw 'Archive histórico falhou'}
Expand-Archive -LiteralPath $taskArchive -DestinationPath (Join-Path $taskRecovery 'archive')
$taskTargets=@{}
foreach($record in @(@('backend','copy-path.txt'),@('frontend','front-causal-copy.txt'))){
 $taskTarget=[IO.Path]::GetFullPath((Get-Content -LiteralPath (Join-Path $taskHistorical $record[1]) -Raw).Trim())
 $taskExpected=[IO.Path]::GetFullPath((Join-Path $taskBackend 'target'))+[IO.Path]::DirectorySeparatorChar
 if(-not $taskTarget.StartsWith($taskExpected,[StringComparison]::OrdinalIgnoreCase)){throw 'Destino fora de target'}
 if((Test-Path -LiteralPath $taskTarget) -and -not $Resume){throw 'Não substituir cópia existente'}
 if(-not(Test-Path -LiteralPath $taskTarget)){New-Item -ItemType Directory -Path $taskTarget | Out-Null}
 $taskTargets[$record[0]]=$taskTarget
}
$taskBackendBase=Join-Path $taskRecovery 'archive/controle-financeiro-backend'
if(-not $Resume){foreach($part in @('src','.mvn','pom.xml','mvnw.cmd')){Copy-Item -LiteralPath (Join-Path $taskBackendBase $part) -Destination $taskTargets.backend -Recurse}}
$taskCheckpoint=Get-Content -LiteralPath (Join-Path $taskHistorical 'checkpoint.json') -Raw | ConvertFrom-Json
$taskMatched=0
$taskByteMismatches=@()
foreach($record in $taskCheckpoint.product){
 $file=Join-Path $taskTargets.backend $record.file
 $shared=Join-Path $taskBackend $record.file
 if((Test-Path -LiteralPath $shared) -and (Get-FileHash -LiteralPath $shared).Hash.ToLowerInvariant() -eq $record.sha256){Copy-Item -LiteralPath $shared -Destination $file -Force}
 if((Get-FileHash -LiteralPath $file).Hash.ToLowerInvariant() -ne $record.sha256){
  $content=[IO.File]::ReadAllText($file).Replace("`r`n","`n")
  foreach($variant in @($content,$content.Replace("`n","`r`n"))){
   foreach($bom in @($false,$true)){
    $encoding=[Text.UTF8Encoding]::new($bom)
    [byte[]]$bytes=$encoding.GetPreamble()+$encoding.GetBytes($variant)
    $hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
    if($hash -eq $record.sha256){[IO.File]::WriteAllBytes($file,$bytes);break}
   }
  }
 }
 if((Get-FileHash -LiteralPath $file).Hash.ToLowerInvariant() -ne $record.sha256){$taskByteMismatches+=$record.file}
 else {$taskMatched++}
}
Copy-Item -LiteralPath (Join-Path $taskHistorical 'Rv24IndependentDeletionReviewTest.java') -Destination (Join-Path $taskTargets.backend 'src/test/java/com/controlefinanceiro/api/service')
$taskFrontBase=Join-Path $taskRecovery 'archive/controle-financeiro-frontend'
foreach($part in @('src','tests')){Copy-Item -LiteralPath (Join-Path $taskFrontBase $part) -Destination $taskTargets.frontend -Recurse}
Copy-Item -LiteralPath (Join-Path $taskHistorical 'rv24-independent-review.test.tsx') -Destination (Join-Path $taskTargets.frontend 'tests/component')
New-Item -ItemType Junction -Path (Join-Path $taskTargets.frontend 'node_modules') -Target (Join-Path $taskRoot 'controle-financeiro-frontend/node_modules') | Out-Null
foreach($modal in @('src/components/forms/newTransactionModal.tsx','src/components/forms/operationModal.tsx')){
 $content=& git -C $taskRoot show ('30211b8:controle-financeiro-frontend/'+$modal)
 if($LASTEXITCODE -ne 0){throw 'Modal histórico ausente'}
 [IO.File]::WriteAllText((Join-Path $taskTargets.frontend $modal),($content -join "`n")+"`n")
}
foreach($directory in $taskTargets.Values){[IO.File]::WriteAllText((Join-Path $directory 'CF027-RECONSTRUCTED.txt'),'Reconstructed source fixture from Git/published review. Original generated output and temporary harness edits are not recovered. Do not attribute new executions to historical runs.')}
[pscustomobject]@{base='5d0649a';targets=$taskTargets;backend_product_hashes_matched=$taskMatched;backend_product_byte_mismatches=$taskByteMismatches;original_generated_outputs_recovered=$false;historical_evidence_untouched=$true} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'historical-reconstruction.json')
