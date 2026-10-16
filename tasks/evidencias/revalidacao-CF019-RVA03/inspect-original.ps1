$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$source=Join-Path $PSScriptRoot '../revalidacao-CF-016-CF-021/browser/falha-pagamento120'
$zip=[IO.Compression.ZipFile]::OpenRead((Join-Path $source 'trace.zip'))
$actions=@();$network=@();$styles=@()
function ReadEntry($entry) { $r=[IO.StreamReader]::new($entry.Open());try{$r.ReadToEnd()}finally{$r.Dispose()} }
function Walk($node,$call) {
 if($node -isnot [array]){return}
 if($node.Count -gt 1 -and $node[1] -is [System.Management.Automation.PSCustomObject] -and ($node[1].role -eq 'dialog' -or $node[1].class -match 'fixed inset-0 z-50')) {
  @{call=$call;tag=$node[0];attributes=$node[1]}
 }
 foreach($child in $node){if($child -is [array]){Walk $child $call}}
}
try {
 foreach($entry in $zip.Entries | Where-Object FullName -Match '\.(trace|network)$') {
  foreach($line in (ReadEntry $entry) -split "`n" | Where-Object {$_.Trim()}) {
   $item=$line|ConvertFrom-Json
   if($item.type -eq 'before' -and $item.method -in @('clockSetFixedTime','goto','reload','expect','click')) {
    $actions+=@{id=$item.callId;start=$item.startTime;method=$item.method;params=$item.params}
   }
   if($item.type -eq 'after'){$actions+=@{id=$item.callId;end=$item.endTime;error=$item.error.message}}
   if($item.type -eq 'resource-snapshot' -and $item.snapshot.request.url -match '/api/(cards|accounts|planning|dashboard)') {
    $s=$item.snapshot
    $body=$null
    if($s.request.url -match '/api/(cards|accounts)') {
     $bodyPath=if($s.response.content._file){$s.response.content._file}else{'resources/'+$s.response.content._sha1}
     $bodyEntry=$zip.GetEntry($bodyPath)
     if($bodyEntry){$body=(ReadEntry $bodyEntry)|ConvertFrom-Json}
    }
    $network+=@{method=$s.request.method;path=([uri]$s.request.url).PathAndQuery;status=$s.response.status;time=$s.time;start=$s._monotonicTime;timings=$s.timings;financialBody=$body;paymentCommand=if($s.request.url -match '/pay$'){$s.request.postData.text}else{$null}}
   }
   if($item.type -eq 'frame-snapshot'){$styles+=@(Walk $item.snapshot.html $item.snapshot.callId)}
  }
 }
 @{actions=$actions;network=$network;directSnapshotAttributes=$styles;note='Snapshot deltas are not reconstructed runtime or React state. Only synthetic financial response bodies exported; no headers, cookies or authentication bodies.'}|ConvertTo-Json -Depth 40|Set-Content (Join-Path $PSScriptRoot 'original-trace-summary.json')
 Get-ChildItem $source -File|ForEach-Object {@{file=$_.Name;sha256=(Get-FileHash $_.FullName).Hash}}|ConvertTo-Json|Set-Content (Join-Path $PSScriptRoot 'original-hashes.json')
}finally{$zip.Dispose()}
