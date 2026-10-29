param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference = 'Stop'
$executionPath = (Resolve-Path -LiteralPath $Runtime).Path
$allowedPath = [IO.Path]::GetFullPath((Join-Path (Get-Location) '../controle-financeiro-runtimes/preparacao-adocao')) + [IO.Path]::DirectorySeparatorChar
if (-not $executionPath.StartsWith($allowedPath, [StringComparison]::OrdinalIgnoreCase)) { throw 'Preparation runtime required' }
$manifest = Get-Content -Raw -LiteralPath (Join-Path $executionPath 'inputs.json') | ConvertFrom-Json
$prefix = 'controle-financeiro-backend/src/main/resources/'
$resources = @($manifest.inputs | Where-Object { $_.file.StartsWith($prefix) })
if ($resources.Count -ne 22) { throw 'Unexpected resource set' }
$archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $executionPath 'package/api.jar'))
try {
    $results = foreach ($resource in $resources) {
        $relative = $resource.file.Substring($prefix.Length)
        $entryName = if ($relative.StartsWith('META-INF/')) { $relative } else { 'BOOT-INF/classes/' + $relative }
        $entry = $archive.GetEntry($entryName)
        if ($null -eq $entry) { throw "Missing packaged resource: $entryName" }
        $stream = $entry.Open()
        try {
            $hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($stream)).ToLowerInvariant()
        } finally { $stream.Dispose() }
        if ($hash -ne $resource.sha256) { throw "Packaged resource differs: $entryName" }
        [PSCustomObject]@{file=$resource.file; entry=$entryName; sha256=$hash}
    }
} finally { $archive.Dispose() }
$outputPath = Join-Path $executionPath 'packaged-resources-final.json'
if (Test-Path -LiteralPath $outputPath) { throw 'Keep previous receipt; choose a new execution' }
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $outputPath -Encoding utf8NoBOM
Write-Output ('PACKAGED_RESOURCES=VERIFIED count=' + $results.Count)
