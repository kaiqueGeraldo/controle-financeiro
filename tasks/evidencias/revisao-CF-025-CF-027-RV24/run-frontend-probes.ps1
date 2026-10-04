param([string]$RunName='frontend-probes')
$ErrorActionPreference='Stop'
if($RunName -notmatch '^[a-z0-9-]+$'){throw 'Invalid run name'}
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$front=Join-Path $root 'controle-financeiro-frontend'
$evidence=Join-Path $PSScriptRoot $RunName
if(Test-Path -LiteralPath $evidence){throw 'Preserve previous evidence'}
$copy=Join-Path ([IO.Path]::GetTempPath()) ('cf-review-front-probes-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $copy,$evidence | Out-Null
foreach($part in @('src','tests','tsconfig.json','package.json')){Copy-Item -LiteralPath (Join-Path $front $part) -Destination $copy -Recurse}
New-Item -ItemType Junction -Path (Join-Path $copy 'node_modules') -Target (Join-Path $front 'node_modules') | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'financial-result-review.test.tsx') -Destination (Join-Path $copy 'tests/component')
$results=@()
function Run-Probe([string]$name,[string]$test,[string]$pattern='') {
 Push-Location $copy
 try {
  $args=@('node_modules/vitest/vitest.mjs','run','--config','tests/component/vitest.config.mts',$test)
  if($pattern){$args+=@('-t',$pattern)}
  & node @args *> (Join-Path $evidence ($name+'.log'))
  $script:results += [pscustomobject]@{name=$name;exit=$LASTEXITCODE}
 } finally {Pop-Location}
}
Run-Probe 'financial-result' 'tests/component/financial-result-review.test.tsx'
$parts=@('src/components/forms/configDashboardModal.tsx','src/components/forms/changePasswordModal.tsx','src/components/forms/depositGoalModal.tsx')
try {
 foreach($part in $parts){
  $content=git -C $root show ('5f26a1d:controle-financeiro-frontend/'+$part)
  if($LASTEXITCODE -ne 0){throw 'Historical source missing'}
  [IO.File]::WriteAllText((Join-Path $copy $part),($content -join "`n")+"`n")
 }
 Run-Probe 'cf026-before' 'tests/component/cf026-contracts.test.tsx'
} finally {foreach($part in $parts){Copy-Item -LiteralPath (Join-Path $front $part) -Destination (Join-Path $copy $part)}}
$hook='src/hooks/useOptimisticMutation.ts'
try {
 $text=[IO.File]::ReadAllText((Join-Path $copy $hook))
 if(!$text.Contains('generationRef.current === mutationGeneration;')){throw 'Mutation point missing'}
 [IO.File]::WriteAllText((Join-Path $copy $hook),$text.Replace('generationRef.current === mutationGeneration;','true;'))
 Run-Probe 'cf026-generation-red' 'tests/component/cf026-contracts.test.tsx' 'cleanup'
} finally {Copy-Item -LiteralPath (Join-Path $front $hook) -Destination (Join-Path $copy $hook)}
Run-Probe 'cf026-restored' 'tests/component/cf026-contracts.test.tsx'
$parts+=@($hook)
$restored=@($parts | ForEach-Object {[pscustomobject]@{path=$_;matches=((Get-FileHash (Join-Path $copy $_)).Hash -eq (Get-FileHash (Join-Path $front $_)).Hash)}})
[pscustomobject]@{copy=$copy;results=$results;restored=$restored} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $evidence 'result.json')
Get-Content (Join-Path $evidence 'result.json')
