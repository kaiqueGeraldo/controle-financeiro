param()
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$frontend=Join-Path $repo 'controle-financeiro-frontend'
$isolatedParent=Join-Path ([IO.Path]::GetTempPath()) ('cf031-own-identity-counterproof-'+[guid]::NewGuid().ToString('N'))
$isolated=Join-Path $isolatedParent 'frontend'
New-Item -ItemType Directory -Path $isolated | Out-Null
Copy-Item -LiteralPath "$frontend/src" -Destination $isolated -Recurse
Copy-Item -LiteralPath "$frontend/package.json","$frontend/tsconfig.json" -Destination $isolated
New-Item -ItemType Directory -Path "$isolated/tests/component" | Out-Null
Copy-Item -LiteralPath "$frontend/tests/component/setup.ts" -Destination "$isolated/tests/component"
# Only dependency/fixture reads cross these junctions; mutations target copied source files.
New-Item -ItemType Junction -Path "$isolated/node_modules" -Value "$frontend/node_modules" | Out-Null
New-Item -ItemType Junction -Path "$isolatedParent/tasks" -Value "$repo/tasks" | Out-Null
@'
import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src/',import.meta.url))}},test:{environment:'jsdom',include:['src/services/onboarding/**/*.test.tsx'],setupFiles:['./tests/component/setup.ts'],reporters:['verbose'],restoreMocks:true,unstubGlobals:true}});
'@ | Set-Content -LiteralPath "$isolated/vitest.config.mts"
$copied=@(Get-ChildItem -LiteralPath "$isolated/src" -Recurse -File | ForEach-Object { [ordered]@{path=[IO.Path]::GetRelativePath($isolated,$_.FullName);sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash} })
$copied | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$PSScriptRoot/counterproof-source-sha256.json"
$isolated | Set-Content -LiteralPath "$PSScriptRoot/counterproof-path.txt"
function Test-Copy([string]$Name,[string]$Pattern='') {
 $argsList=@("$frontend/node_modules/vitest/vitest.mjs",'run','--config',"$isolated/vitest.config.mts")
 if($Pattern){$argsList+=@('-t',$Pattern)}
 Push-Location $isolated
 try { & 'C:/Program Files/nodejs/node.exe' @argsList *> "$PSScriptRoot/$Name.log"; $result=$LASTEXITCODE } finally { Pop-Location }
 return $result
}
# Re-run the final controls against the coherent original five-file snapshot.
# This closes the two matcher gaps in the first newly written component probes.
$baselinePaths=@('src/services/onboarding/model.ts','src/services/onboarding/input.ts','src/services/onboarding/result.ts','src/screens/private/onboarding/Fields.tsx','src/screens/private/onboarding/Review.tsx')
$baselineBytes=@{}
try {
 foreach($relative in $baselinePaths) {
  $target=Join-Path $isolated $relative
  if(-not ([IO.Path]::GetFullPath($target)).StartsWith([IO.Path]::GetFullPath($isolated)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Baseline escaped copy'}
  $baselineBytes[$target]=[IO.File]::ReadAllBytes($target)
  $ref='75ede48:controle-financeiro-frontend/'+$relative
  $old=& git -C $repo show $ref
  if($LASTEXITCODE -ne 0){throw ('Cannot read baseline '+$ref)}
  [IO.File]::WriteAllText($target,($old -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
 }
 $baselineExit=Test-Copy 'controls-baseline-corrected-harness' 'reference identity uses the validated own member'
 if($baselineExit -eq 0 -or -not (Select-String -LiteralPath "$PSScriptRoot/controls-baseline-corrected-harness.log" -Pattern 'AssertionError' -Quiet)){throw 'Baseline must reproduce identity assertion failures'}
} finally {foreach($entry in $baselineBytes.GetEnumerator()){[IO.File]::WriteAllBytes($entry.Key,$entry.Value)}}
$before=Test-Copy 'counterproof-control-before'
if($before -ne 0){throw 'Isolated control failed before mutation; inspect preserved log'}
$mutations=@(
 @{name='inherited-identity-precedence';file='model.ts';old='const identity = ownReferenceIdentity(r);';new='const identity = r.id ?? r.tempId;';pattern='reference identity uses the validated own member'}
)
$results=@()
foreach($m in $mutations) {
 $target=Join-Path $isolated ('src/services/onboarding/'+$m.file)
 $resolved=[IO.Path]::GetFullPath($target)
 if(-not $resolved.StartsWith([IO.Path]::GetFullPath($isolated)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Mutation escaped copy'}
 $original=[IO.File]::ReadAllBytes($target);$content=[IO.File]::ReadAllText($target)
 if(([regex]::Matches($content,[regex]::Escape($m.old))).Count -ne 1){throw ('Mutation must match once: '+$m.name)}
 try {
  [IO.File]::WriteAllText($target,$content.Replace($m.old,$m.new))
  & git diff --no-index -- (Join-Path "$frontend/src/services/onboarding" $m.file) $target *> "$PSScriptRoot/mutation-$($m.name).diff"
  $result=Test-Copy ('mutation-'+$m.name) $m.pattern
  $assertion=Select-String -LiteralPath "$PSScriptRoot/mutation-$($m.name).log" -Pattern 'AssertionError' -Quiet
  $results += [ordered]@{name=$m.name;exitCode=$result;assertionFailure=$assertion}
  if($result -eq 0 -or -not $assertion){throw ('Mutation not killed by assertion: '+$m.name)}
 } finally { [IO.File]::WriteAllBytes($target,$original) }
}
$after=Test-Copy 'counterproof-control-restored'
$differences=@($copied | Where-Object { (Get-FileHash -LiteralPath (Join-Path $isolated $_.path) -Algorithm SHA256).Hash -ne $_.sha256 })
[ordered]@{copy=$isolated;mutations=$results;controlBefore=$before;controlRestored=$after;copyFiles=$copied.Count;restorationDifferences=$differences} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath "$PSScriptRoot/counterproof-results.json"
if($after -ne 0 -or $differences.Count){throw 'Restored control or source comparison failed'}
Get-Content -LiteralPath "$PSScriptRoot/counterproof-results.json"
