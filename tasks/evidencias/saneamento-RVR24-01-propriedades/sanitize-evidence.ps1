$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$reviewRoot = $PSScriptRoot
$manifest = Join-Path $reviewRoot 'sanitization.json'
if (Test-Path -LiteralPath $manifest) { throw 'Proveniência já existe; não sobrescrever.' }
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Clean-Text([string]$value) {
    $value = [regex]::Replace($value, 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[REDACTED_SYNTHETIC_JWT]')
    $value = [regex]::Replace($value, '("(?:password|senha|accessToken|refreshToken)"\s*:\s*")[^"]*(")', '$1[REDACTED_SYNTHETIC_CREDENTIAL]$2', 'IgnoreCase')
    $value = [regex]::Replace($value, '(\\"(?:password|senha|accessToken|refreshToken)\\"\s*:\s*\\").*?(\\")', '$1[REDACTED_SYNTHETIC_CREDENTIAL]$2', 'IgnoreCase')
    return $value
}
$records = @(Get-ChildItem -LiteralPath $reviewRoot -Recurse -File | Where-Object { $_.Extension -in @('.log','.xml','.txt','.json','.zip') -or $_.Name -eq 'error-context.md' } | ForEach-Object {
    $file = $_
    $before = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($file.Extension -eq '.zip') {
        $archive = [System.IO.Compression.ZipFile]::Open($file.FullName, [System.IO.Compression.ZipArchiveMode]::Update)
        try {
            foreach ($entry in @($archive.Entries)) {
                if ($entry.FullName.EndsWith('/')) { continue }
                $stream = $entry.Open(); $buffer = New-Object System.IO.MemoryStream
                try { $stream.CopyTo($buffer); $bytes = $buffer.ToArray() } finally { $stream.Dispose(); $buffer.Dispose() }
                $original = $utf8.GetString($bytes); $cleaned = Clean-Text $original
                if ($cleaned -cne $original) {
                    $stream = $entry.Open()
                    try { $stream.SetLength(0); $bytes = $utf8.GetBytes($cleaned); $stream.Write($bytes,0,$bytes.Length) } finally { $stream.Dispose() }
                }
            }
        } finally { $archive.Dispose() }
    } else {
        $original = [System.IO.File]::ReadAllText($file.FullName)
        $cleaned = Clean-Text $original
        if ($cleaned -cne $original) { [System.IO.File]::WriteAllText($file.FullName,$cleaned,$utf8) }
    }
    $after = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    [pscustomobject]@{ file=$file.FullName.Substring($reviewRoot.Length+1).Replace('\','/'); original_sha256=$before; published_sha256=$after; changed=($before -ne $after) }
})
[System.IO.File]::WriteAllText($manifest,($records | ConvertTo-Json -Depth 4)+[Environment]::NewLine,$utf8)
$records | Group-Object changed | Select-Object Name,Count
