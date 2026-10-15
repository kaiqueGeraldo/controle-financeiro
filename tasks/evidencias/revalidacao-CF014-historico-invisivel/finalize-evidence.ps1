$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$utf8=[Text.UTF8Encoding]::new($false)
$exports=@(Get-ChildItem $PSScriptRoot -Recurse -Filter '*.log' -File | Where-Object {$_.Name -notlike '*.raw.log'} | ForEach-Object {
 $p=$_.FullName;$raw=$p.Replace('.log','.raw.log')
 if(!(Test-Path $raw)){Copy-Item -LiteralPath $p -Destination $raw}
 $original=[IO.File]::ReadAllText($raw)
 $clean=[regex]::Replace($original,'[\t ]+(?=\r?$)','',[Text.RegularExpressions.RegexOptions]::Multiline)
 [IO.File]::WriteAllText($p,$clean,$utf8)
 [pscustomobject]@{file=$p.Substring($PSScriptRoot.Length+1);rawHash=(Get-FileHash $raw).Hash;exportHash=(Get-FileHash $p).Hash}
})
$exports | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'log-exports.json')
$sources=@('controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/Cf014HistoryReviewTest.java','controle-financeiro-frontend/tests/e2e/cf014-history-review.integrated.spec.ts','controle-financeiro-frontend/tests/e2e/playwright.cf014-history-review.config.ts','controle-financeiro-frontend/tests/e2e/cf014-history-diagnostic.integrated.spec.ts','controle-financeiro-frontend/tests/e2e/support/civil-date-clock.ts','controle-financeiro-frontend/tests/e2e/rf15-matrix.integrated.spec.ts')
$sources | ForEach-Object {[pscustomobject]@{file=$_;sha256=(Get-FileHash (Join-Path $root $_)).Hash}} | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'SOURCE-SHA256.json')
Get-ChildItem $PSScriptRoot -Recurse -File | Where-Object Name -ne 'EVIDENCE-SHA256.json' | Sort-Object FullName | ForEach-Object {[pscustomobject]@{file=$_.FullName.Substring($PSScriptRoot.Length+1).Replace('\','/');size=$_.Length;sha256=(Get-FileHash $_.FullName).Hash}} | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'EVIDENCE-SHA256.json')
