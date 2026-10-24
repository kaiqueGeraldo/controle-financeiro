param([Parameter(Mandatory=$true)][string]$RuntimeRoot,[Parameter(Mandatory=$true)][string]$Evidence)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path "$PSScriptRoot/../../..").Path
$runtime=(Resolve-Path -LiteralPath $RuntimeRoot).Path
$allowed=[IO.Path]::GetFullPath("$repo/../controle-financeiro-runtimes/CF-033/")
if(-not $runtime.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Not an isolated CF033 runtime'}
$out=[IO.Path]::GetFullPath($Evidence)
if(Test-Path -LiteralPath $out){throw 'Preserve previous evidence'}
New-Item -ItemType Directory -Path $out | Out-Null
Push-Location "$runtime/frontend"
try {
 & node node_modules/eslint/bin/eslint.js tests/cf033/probes.ts *> "$out/lint.log"
 $lint=$LASTEXITCODE
 & node node_modules/typescript/bin/tsc --noEmit *> "$out/typecheck.log"
 $types=$LASTEXITCODE
 [ordered]@{runtime=$runtime;head=(git -C $repo rev-parse HEAD);lint=$lint;typecheck=$types} | ConvertTo-Json | Set-Content "$out/results.json"
 if($lint -ne 0 -or $types -ne 0){throw 'Inspect preserved static-check logs'}
} finally {Pop-Location}
