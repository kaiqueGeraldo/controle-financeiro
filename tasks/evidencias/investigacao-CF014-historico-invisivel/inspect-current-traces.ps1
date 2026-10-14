$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$reports=foreach($file in Get-ChildItem $PSScriptRoot -Filter '*trace.zip' -Recurse) {
    $archive=[IO.Compression.ZipFile]::OpenRead($file.FullName)
    try {
        $http=@();$css=@();$calls=@{};$jwt=0
        foreach($entry in $archive.Entries | Where-Object FullName -Match '\.(trace|network)$') {
            $reader=[IO.StreamReader]::new($entry.Open())
            try {$text=$reader.ReadToEnd()} finally {$reader.Dispose()}
            $jwt+=([regex]::Matches($text,'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')).Count
            foreach($line in $text -split "`n" | Where-Object {$_}) {
                $item=$line | ConvertFrom-Json
                if($item.type -eq 'resource-snapshot' -and $item.snapshot.request.url -match '/investments/[^/]+/history$') {
                    $http+=@{method=$item.snapshot.request.method;path=([uri]$item.snapshot.request.url).AbsolutePath;status=$item.snapshot.response.status}
                }
                if($item.type -eq 'before' -and $item.params.expression -eq 'to.have.css') {
                    $calls[$item.callId]=$true
                    $css+=@{callId=$item.callId;start=$item.startTime;property=$item.params.expressionArg;expected=$item.params.expectedText}
                }
                if($item.type -eq 'after' -and $calls.ContainsKey([string]$item.callId)) {
                    $css+=@{callId=$item.callId;end=$item.endTime;result=$item.result;error=$item.error}
                }
            }
        }
        if($jwt){throw 'Unsanitized JWT in current trace'}
        [ordered]@{file=$file.FullName.Substring($PSScriptRoot.Length+1).Replace('\','/');sha256=(Get-FileHash $file.FullName -Algorithm SHA256).Hash;size=$file.Length;jwtRemaining=$jwt;historyHttp=$http;css=$css}
    } finally {$archive.Dispose()}
}
$reports | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $PSScriptRoot 'current-trace-inspection.json')
