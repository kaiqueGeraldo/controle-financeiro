$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$taskFront=Join-Path $taskRoot 'controle-financeiro-frontend'
$taskCopy=Join-Path ([IO.Path]::GetTempPath()) ('rv24-own-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $taskCopy,(Join-Path $taskCopy 'tests') | Out-Null
foreach($part in @('src','package.json','tsconfig.json','next-env.d.ts')) {
 Copy-Item -LiteralPath (Join-Path $taskFront $part) -Destination $taskCopy -Recurse
}
Copy-Item -LiteralPath (Join-Path $taskFront 'tests/component') -Destination (Join-Path $taskCopy 'tests') -Recurse
New-Item -ItemType Junction -Path (Join-Path $taskCopy 'node_modules') -Target (Join-Path $taskFront 'node_modules') | Out-Null
$taskFiles=@('src/services/creationResult.ts','src/services/creationIntent.ts','src/services/vendor/lossless-json/parse.js','src/services/vendor/lossless-json/revive.js')
$taskBytes=@{}
foreach($file in $taskFiles){$taskBytes[$file]=[IO.File]::ReadAllBytes((Join-Path $taskCopy $file))}
$taskResults=@()
function Run-Proof([string]$name,[string]$spec){
 Push-Location $taskCopy
 try { & node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts $spec *> (Join-Path $PSScriptRoot ($name+'.log')); $script:taskResults+= [pscustomobject]@{name=$name;exit=$LASTEXITCODE} }
 finally {Pop-Location}
}
try {
 foreach($file in $taskFiles[0..1]){
   $content= & git -C $taskRoot show ('d4e5a06:controle-financeiro-frontend/'+$file)
   if($LASTEXITCODE -ne 0){throw 'Git baseline unavailable'}
   [IO.File]::WriteAllText((Join-Path $taskCopy $file),($content -join "`n")+"`n")
 }
 Run-Proof 'counter-own-old' 'tests/component/own-properties.test.tsx'
 foreach($file in $taskFiles[0..1]){[IO.File]::WriteAllBytes((Join-Path $taskCopy $file),$taskBytes[$file])}
 foreach($file in $taskFiles[2..3]){
   $path=Join-Path $taskCopy $file
   $text=[IO.File]::ReadAllText($path)
   $text=$text.Replace('Object.defineProperty(object, key, { value: returnedValue, enumerable: true, writable: true, configurable: true });','object[key] = returnedValue;')
   $text=$text.Replace('Object.defineProperty(object, key, { value, enumerable: true, writable: true, configurable: true });','object[key] = value;')
   [IO.File]::WriteAllText($path,$text)
 }
 Run-Proof 'counter-construction-old' 'tests/component/parser-independent.test.tsx'
} finally {
 foreach($file in $taskFiles){[IO.File]::WriteAllBytes((Join-Path $taskCopy $file),$taskBytes[$file])}
}
Run-Proof 'counter-restored' 'tests/component/own-properties.test.tsx'
$taskHashes=@($taskFiles | ForEach-Object {
 $original=(Get-FileHash -LiteralPath (Join-Path $taskFront $_)).Hash
 $restored=(Get-FileHash -LiteralPath (Join-Path $taskCopy $_)).Hash
 if($original -ne $restored){throw 'Restoration mismatch'}
 [pscustomobject]@{file=$_;main=$original;restored=$restored}
})
[pscustomobject]@{copy=$taskCopy;results=$taskResults;hashes=$taskHashes} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $PSScriptRoot 'counterproof.json')
$taskResults | Format-Table
