$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot = (Get-Location).Path
$taskJar = [IO.Path]::GetFullPath((Join-Path $taskRoot '../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar'))
$taskArchive = [IO.Compression.ZipFile]::OpenRead($taskJar)
$taskRows = [System.Collections.Generic.List[object]]::new()
try {
    $taskFiles = Get-ChildItem -LiteralPath (Join-Path $taskRoot 'controle-financeiro-backend/src/main/resources') -File -Recurse
    foreach ($taskFile in $taskFiles) {
        $taskRelative = [IO.Path]::GetRelativePath((Join-Path $taskRoot 'controle-financeiro-backend/src/main/resources'), $taskFile.FullName).Replace('\','/')
        $taskEntryName = if ($taskRelative.StartsWith('META-INF/')) { $taskRelative } else { 'BOOT-INF/classes/' + $taskRelative }
        $taskEntry = $taskArchive.GetEntry($taskEntryName)
        if (!$taskEntry) { throw "Resource absent: $taskEntryName" }
        $taskStream = $taskEntry.Open()
        try { $taskActual = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($taskStream)).ToLowerInvariant() } finally { $taskStream.Dispose() }
        $taskExpected = (Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($taskActual -ne $taskExpected) { throw "Resource differs: $taskEntryName" }
        $taskRows.Add(@{entry=$taskEntryName;sha256=$taskActual;source=$taskRelative;equal=$true})
    }
    $taskReceipt = @{at=[DateTime]::UtcNow.ToString('o');jarSha256=(Get-FileHash -LiteralPath $taskJar).Hash.ToLowerInvariant();resources=$taskRows;resourceCount=$taskRows.Count;libraries=@($taskArchive.Entries | Where-Object {$_.FullName -match '^BOOT-INF/lib/[^/]+.jar$'} | ForEach-Object {$_.FullName});reproducibleBinaryClaimed=$false;producerCommit='24844b594e4ed8fe906e0fc6eaee32bdd58f31a0'}
    $taskReceipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath 'tasks/evidencias/revisao-preparacao-local-adocao/pacote-verificado.json' -Encoding utf8
    Write-Output "resources=$($taskRows.Count) hash=$($taskReceipt.jarSha256)"
} finally { $taskArchive.Dispose() }
