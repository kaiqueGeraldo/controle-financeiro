param()
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$frontend=Join-Path $repo 'controle-financeiro-frontend'
$isolatedParent=Join-Path ([IO.Path]::GetTempPath()) ('rc031-remediation-counterproof-'+[guid]::NewGuid().ToString('N'))
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
$before=Test-Copy 'counterproof-control-before'
if($before -ne 0){throw 'Isolated control failed before mutation; inspect preserved log'}
$mutationTarget=Join-Path $isolated 'src/services/onboarding/result.ts'
$candidate=[IO.File]::ReadAllText($mutationTarget)
$start=$candidate.IndexOf('function legacyReservation(value: unknown) {')
$stop=$candidate.IndexOf('function reservationReview(v: unknown)', $start)
if($start -lt 0 -or $stop -lt 0){throw 'Missing reservation boundary'}
$strong=$candidate.Substring($start,$stop-$start)
$weak=@'
function legacyReservation(value: unknown) {
  const r = record(value, ["reservationId", "revision", "goal", "nominal", "attribution"]);
  expect(uuid(r.reservationId) && revision(r.revision)); summaryAmount(r.nominal); return r;
}

'@
$mutations=@(
 @{name='free-sum';file='result.ts';old='reconcileSum(m[kind === "ACCOUNT" ? "freeAccountCash" : "unallocatedInvestments"], rows.map(s => s.free));';new='';pattern='rejects adulterated|wrong partial free|incoherent free knowledge'},
 @{name='reservation-structure';file='result.ts';old=$strong;new=$weak;pattern='RC031-02'}
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
