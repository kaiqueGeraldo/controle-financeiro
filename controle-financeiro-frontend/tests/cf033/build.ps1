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
try{
 & node node_modules/next/dist/bin/next build *> "$out/build.log"
 $code=$LASTEXITCODE
 [ordered]@{runtime=$runtime;head=(git -C $repo rev-parse HEAD);node=(& node --version);exit=$code;finished=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content "$out/execution.json"
 Get-Content "$out/build.log" -Tail 12
 if($code -ne 0){exit $code}
}finally{Pop-Location}
