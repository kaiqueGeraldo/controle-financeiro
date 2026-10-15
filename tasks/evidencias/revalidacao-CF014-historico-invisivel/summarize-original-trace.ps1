$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Split-Path (Split-Path (Split-Path $PSScriptRoot))
$original=Join-Path $root 'tasks/evidencias/revalidacao-residual-RF15/browser/artifacts/rf15-matrix.integrated-Mat-2918b-rico-carregado-e-ação-modal-review-sao-paulo'
$archive=[IO.Compression.ZipFile]::OpenRead((Join-Path $original 'trace.zip'))
function Read-Entry($entry) {
    $reader=[IO.StreamReader]::new($entry.Open())
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}
function History-Styles($node,$callId,$phase) {
    if($node -isnot [array]){return}
    if($node.Count -ge 2 -and $node[0] -eq 'DIV' -and $node[1].class -eq 'bg-bg-base p-6 flex-1 overflow-y-auto custom-scroll') {
        @{callId=$callId;phase=$phase;style=$node[1].style}
    }
    foreach($child in $node){if($child -is [array]){History-Styles $child $callId $phase}}
}
try {
    $actions=@();$http=@();$styles=@()
    foreach($entry in $archive.Entries | Where-Object FullName -Match '\.(trace|network)$') {
        foreach($line in (Read-Entry $entry) -split "`n" | Where-Object { $_.Trim() }) {
            $item=$line | ConvertFrom-Json
            if($item.type -eq 'before' -and ($item.method -eq 'clockSetFixedTime' -or ($item.method -eq 'goto' -and $item.params.url -match '/investimentos$') -or ($item.method -eq 'expect' -and $item.params.expression -eq 'to.have.css'))) {
                $actions+=@{ callId=$item.callId;method=$item.method;start=$item.startTime;params=$item.params }
            }
            if($item.type -eq 'after' -and $item.error.message -match 'toHaveCSS') {
                $actions+=@{ callId=$item.callId;end=$item.endTime;error=$item.error.message }
            }
            if($item.type -eq 'resource-snapshot' -and $item.snapshot.request.url -match '/investments/[^/]+/history$') {
                $snap=$item.snapshot
                $bodyPath=if($snap.response.content._file){$snap.response.content._file}else{'resources/'+$snap.response.content._sha1}
                $bodyEntry=$archive.GetEntry($bodyPath)
                $body=if($bodyEntry){ (Read-Entry $bodyEntry) | ConvertFrom-Json }else{$null}
                $http+=@{ method=$snap.request.method;path=([uri]$snap.request.url).AbsolutePath;status=$snap.response.status;body=$body;timings=$snap.timings }
            }
            if($item.type -eq 'frame-snapshot') {
                # Diff snapshots contain references: only directly stored attributes are reported.
                $styles+=@(History-Styles $item.snapshot.html $item.snapshot.callId $item.snapshot.phase)
            }
        }
    }
    @{source='revalidacao-residual-RF15/browser/artifacts/rf15-matrix...';actions=$actions;historyHttp=$http;historyStyles=$styles} | ConvertTo-Json -Depth 30 | Set-Content (Join-Path $PSScriptRoot 'historical-trace-summary.json')
    Get-ChildItem $original -File | ForEach-Object { @{file=$_.FullName.Substring($root.Length+1).Replace('\','/');sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash} } | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'historical-hashes.json')
} finally { $archive.Dispose() }
