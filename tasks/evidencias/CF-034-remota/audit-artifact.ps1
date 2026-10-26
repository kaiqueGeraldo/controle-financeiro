param([Parameter(Mandatory)][string]$ZipPath,[Parameter(Mandatory)][string]$ResultFile,[Parameter(Mandatory)][string]$ExpectedSha256)
$ErrorActionPreference = 'Stop'
$artifactPath = (Resolve-Path -LiteralPath $ZipPath).Path
$runtimeBase = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..\controle-financeiro-runtimes\CF-034')) + [IO.Path]::DirectorySeparatorChar
if (-not $artifactPath.StartsWith($runtimeBase,[StringComparison]::OrdinalIgnoreCase)) { throw 'Only dedicated CF-034 runtime archives are accepted' }
$zipHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath).Hash.ToLowerInvariant()
if ($zipHash -ne $ExpectedSha256.ToLowerInvariant()) { throw 'Downloaded ZIP differs from the platform digest' }
$archive = [IO.Compression.ZipFile]::OpenRead($artifactPath)
$files = @(); $textByPath = @{}; $hashByPath = @{}; $hashChecks = @(); $results = @()
try {
  foreach ($entry in $archive.Entries) {
    $name = $entry.FullName.Replace('\','/')
    if ($name.EndsWith('/')) { continue }
    if ($name.StartsWith('/') -or $name -match '(^|/)\.\.(/|$)|:|(^|/)\.public-pending' -or $hashByPath.ContainsKey($name)) { throw 'Unsafe or duplicate archive path' }
    if ($entry.Length -gt 268435456) { throw 'Unexpected artifact member size' }
    $stream = $entry.Open(); $memory = [IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); $bytes = $memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
    $digest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
    $hashByPath[$name] = $digest
    if ($name -match '\.(json|log)$') {
      $content = [Text.Encoding]::UTF8.GetString($bytes)
      if ($content -match 'CF034_SENTINEL|SENTINEL_(JSON|BEARER|COOKIE|AMBIGUOUS|ESCAPED)') { throw 'Sensitive synthetic sentinel survived platform upload/download' }
      $textByPath[$name] = $content
      if ($name.EndsWith('result.json') -or $name.EndsWith('ready.json') -or $name.EndsWith('package-manifest.json')) { $results += @{ path=$name; value=($content | ConvertFrom-Json -Depth 100) } }
    } elseif (-not $name.EndsWith('.jar')) { throw 'Unexpected artifact file type' }
    $files += @{ path=$name; bytes=$entry.Length; sha256=$digest; sensitiveSentinel=$false }
  }
  foreach ($name in $textByPath.Keys) {
    if (-not $name.EndsWith('collection.json')) { continue }
    $collection = $textByPath[$name] | ConvertFrom-Json -Depth 100
    if ($collection.status -ne 'sanitized') { throw 'Artifact collection is not sanitized' }
    $parent = if ($name.Contains('/')) { $name.Substring(0,$name.LastIndexOf('/')+1) } else { '' }
    foreach ($record in $collection.files) {
      $target = $parent + $record.publicFile
      $match = $hashByPath[$target] -eq $record.sanitizedSha256
      $hashChecks += @{path=$target; matches=$match}
      if (-not $match) { throw 'Downloaded member differs from collection manifest' }
    }
  }
} finally { $archive.Dispose() }
@{at=[DateTime]::UtcNow.ToString('o');zipSha256=$zipHash;platformDigestMatches=$true;files=$files;collectionHashChecks=$hashChecks;results=$results;inspection='downloaded platform archive, without extraction or raw fallback';scope='sentinel formats and collection hashes; no universal secret guarantee'} | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $ResultFile -Encoding utf8NoBOM
@{files=$files.Count;collectionHashChecks=$hashChecks.Count;zipSha256=$zipHash;sentinels=0} | ConvertTo-Json -Compress
