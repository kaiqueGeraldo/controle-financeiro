$ErrorActionPreference='Stop'
$utf8=[Text.UTF8Encoding]::new($false)
$redactions=@(foreach($file in Get-ChildItem $PSScriptRoot -Recurse -Filter error-context.md) {
    $before=(Get-FileHash $file.FullName -Algorithm SHA256).Hash
    $text=[IO.File]::ReadAllText($file.FullName)
    $clean=[regex]::Replace($text,'Cf014-[A-Za-z]+-[0-9]{4}','[REDACTED_SYNTHETIC_PASSWORD]')
    if($text -cne $clean){[IO.File]::WriteAllText($file.FullName,$clean,$utf8)}
    @{file=$file.FullName.Substring($PSScriptRoot.Length+1).Replace('\','/');before=$before;after=(Get-FileHash $file.FullName -Algorithm SHA256).Hash}
})
$redactions | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'sanitization-source-excerpts.json')
$exports=@(foreach($file in Get-ChildItem $PSScriptRoot -Recurse -Filter '*.log' | Where-Object Name -NotLike '*.raw.log') {
    $rawPath=$file.FullName -replace '\.log$','.raw.log'
    if(Test-Path -LiteralPath $rawPath){throw 'Raw log already preserved; do not overwrite'}
    Copy-Item -LiteralPath $file.FullName -Destination $rawPath
    $text=[IO.File]::ReadAllText($file.FullName)
    $clean=[regex]::Replace($text,'[ \t]+(?=\r?$)','',[Text.RegularExpressions.RegexOptions]::Multiline)
    [IO.File]::WriteAllText($file.FullName,$clean,$utf8)
    @{file=$file.FullName.Substring($PSScriptRoot.Length+1).Replace('\','/');rawSha256=(Get-FileHash $rawPath -Algorithm SHA256).Hash;exportSha256=(Get-FileHash $file.FullName -Algorithm SHA256).Hash}
})
$exports | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'log-exports.json')
